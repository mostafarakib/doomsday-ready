import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../../app.js';
import { Movie } from '../movie.model.js';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Movie.deleteMany({});
});

describe('Movie API — Phase 3: CRUD, Cycle Detection & Rewatch Order', () => {
  describe('POST /api/movies', () => {
    it('creates a movie successfully with valid data and server-generated ID', async () => {
      const payload = {
        title: 'Iron Man',
        releaseYear: 2008,
        runtime: 126,
      };

      const res = await request(app).post('/api/movies').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Iron Man');
      expect(res.body.data.normalizedTitle).toBe('iron man');
      expect(res.body.data.releaseYear).toBe(2008);
      expect(res.body.data.runtime).toBe(126);
      expect(res.body.data.watched).toBe(false);
      expect(res.body.data.prerequisites).toEqual([]);
      expect(res.body.data._id).toBeDefined();
      expect(mongoose.Types.ObjectId.isValid(res.body.data._id)).toBe(true);
      expect(res.body.data.createdAt).toBeDefined();
    });

    it('rejects client-supplied _id in create payload (400 Bad Request)', async () => {
      const clientSuppliedId = new mongoose.Types.ObjectId().toString();

      const res = await request(app).post('/api/movies').send({
        _id: clientSuppliedId,
        title: 'Movie With Custom ID',
        releaseYear: 2024,
        runtime: 120,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');

      // Verify document was not created
      const check = await Movie.findById(clientSuppliedId);
      expect(check).toBeNull();
    });

    it('creates a movie with valid prerequisite references', async () => {
      const ironMan = await Movie.create({
        title: 'Iron Man',
        normalizedTitle: 'iron man',
        releaseYear: 2008,
        runtime: 126,
      });

      const res = await request(app)
        .post('/api/movies')
        .send({
          title: 'Iron Man 2',
          releaseYear: 2010,
          runtime: 124,
          prerequisites: [ironMan._id.toString()],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.prerequisites).toEqual([ironMan._id.toString()]);
    });

    it('rejects duplicate titles with different casing or surrounding whitespace (409 Conflict)', async () => {
      await request(app).post('/api/movies').send({
        title: 'The Avengers',
        releaseYear: 2012,
        runtime: 143,
      });

      const res = await request(app).post('/api/movies').send({
        title: '   the avengers   ',
        releaseYear: 2012,
        runtime: 143,
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_TITLE');
    });

    it('rejects missing or empty title (400 Bad Request)', async () => {
      const resEmpty = await request(app).post('/api/movies').send({
        title: '   ',
        releaseYear: 2008,
        runtime: 126,
      });

      expect(resEmpty.status).toBe(400);
      expect(resEmpty.body.success).toBe(false);
      expect(resEmpty.body.error.code).toBe('VALIDATION_ERROR');

      const resMissing = await request(app).post('/api/movies').send({
        releaseYear: 2008,
        runtime: 126,
      });

      expect(resMissing.status).toBe(400);
      expect(resMissing.body.success).toBe(false);
    });

    it('rejects invalid releaseYear (non-positive or non-integer)', async () => {
      const resNegative = await request(app).post('/api/movies').send({
        title: 'Test',
        releaseYear: -2008,
        runtime: 120,
      });
      expect(resNegative.status).toBe(400);

      const resZero = await request(app).post('/api/movies').send({
        title: 'Test',
        releaseYear: 0,
        runtime: 120,
      });
      expect(resZero.status).toBe(400);

      const resFloat = await request(app).post('/api/movies').send({
        title: 'Test',
        releaseYear: 2008.5,
        runtime: 120,
      });
      expect(resFloat.status).toBe(400);
    });

    it('rejects invalid runtime (< 1 or > 300 minutes)', async () => {
      const resLow = await request(app).post('/api/movies').send({
        title: 'Test Short',
        releaseYear: 2020,
        runtime: 0,
      });
      expect(resLow.status).toBe(400);

      const resHigh = await request(app).post('/api/movies').send({
        title: 'Test Long',
        releaseYear: 2020,
        runtime: 301,
      });
      expect(resHigh.status).toBe(400);
    });

    it('rejects malformed prerequisite IDs (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/movies')
        .send({
          title: 'Test Movie',
          releaseYear: 2020,
          runtime: 120,
          prerequisites: ['invalid-id-format'],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects duplicate prerequisite references in create payload (400)', async () => {
      const validId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post('/api/movies')
        .send({
          title: 'Test Movie',
          releaseYear: 2020,
          runtime: 120,
          prerequisites: [validId, validId],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects nonexistent prerequisite references in create payload (400)', async () => {
      const nonexistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post('/api/movies')
        .send({
          title: 'Test Movie',
          releaseYear: 2020,
          runtime: 120,
          prerequisites: [nonexistentId],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_PREREQUISITE');
    });
  });

  describe('GET /api/movies', () => {
    it('returns empty array when no movies exist', async () => {
      const res = await request(app).get('/api/movies');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('returns movies sorted by releaseYear then title', async () => {
      await Movie.create([
        { title: 'The Avengers', normalizedTitle: 'the avengers', releaseYear: 2012, runtime: 143 },
        { title: 'Iron Man', normalizedTitle: 'iron man', releaseYear: 2008, runtime: 126 },
        {
          title: 'Captain America: The First Avenger',
          normalizedTitle: 'captain america: the first avenger',
          releaseYear: 2011,
          runtime: 124,
        },
      ]);

      const res = await request(app).get('/api/movies');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.data[0].title).toBe('Iron Man');
      expect(res.body.data[1].title).toBe('Captain America: The First Avenger');
      expect(res.body.data[2].title).toBe('The Avengers');
    });
  });

  describe('PATCH /api/movies/:id & Cycle Detection', () => {
    it('updates movie details (title, releaseYear, runtime, watched) normally', async () => {
      const movie = await Movie.create({
        title: 'Iron Man',
        normalizedTitle: 'iron man',
        releaseYear: 2008,
        runtime: 126,
        watched: false,
      });

      const res = await request(app).patch(`/api/movies/${movie._id}`).send({
        title: 'Iron Man (Updated)',
        releaseYear: 2009,
        runtime: 130,
        watched: true,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Iron Man (Updated)');
      expect(res.body.data.normalizedTitle).toBe('iron man (updated)');
      expect(res.body.data.releaseYear).toBe(2009);
      expect(res.body.data.runtime).toBe(130);
      expect(res.body.data.watched).toBe(true);
    });

    it('allows valid prerequisite updates on an existing movie', async () => {
      const movieA = await Movie.create({
        title: 'Movie A',
        normalizedTitle: 'movie a',
        releaseYear: 2010,
        runtime: 100,
        prerequisites: [],
      });
      const movieB = await Movie.create({
        title: 'Movie B',
        normalizedTitle: 'movie b',
        releaseYear: 2012,
        runtime: 110,
        prerequisites: [],
      });

      const res = await request(app)
        .patch(`/api/movies/${movieB._id}`)
        .send({
          prerequisites: [movieA._id.toString()],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.prerequisites).toEqual([movieA._id.toString()]);

      // Verify in DB
      const updatedB = await Movie.findById(movieB._id);
      expect(updatedB?.prerequisites.map((p) => p.toString())).toEqual([movieA._id.toString()]);
    });

    it('rejects direct circular dependency (self-reference) with 409 CIRCULAR_DEPENDENCY', async () => {
      const movieA = await Movie.create({
        title: 'Movie A',
        normalizedTitle: 'movie a',
        releaseYear: 2010,
        runtime: 100,
        prerequisites: [],
      });

      const res = await request(app)
        .patch(`/api/movies/${movieA._id}`)
        .send({
          prerequisites: [movieA._id.toString()],
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CIRCULAR_DEPENDENCY');

      // Verify DB document is unchanged
      const checkA = await Movie.findById(movieA._id);
      expect(checkA?.prerequisites).toEqual([]);
    });

    it('rejects 2-node circular dependency (A -> B and B -> A) with 409 CIRCULAR_DEPENDENCY', async () => {
      const movieA = await Movie.create({
        title: 'Movie A',
        normalizedTitle: 'movie a',
        releaseYear: 2010,
        runtime: 100,
        prerequisites: [],
      });
      const movieB = await Movie.create({
        title: 'Movie B',
        normalizedTitle: 'movie b',
        releaseYear: 2012,
        runtime: 110,
        prerequisites: [movieA._id], // B depends on A
      });

      // Attempt to update A to depend on B -> introduces cycle A -> B -> A
      const res = await request(app)
        .patch(`/api/movies/${movieA._id}`)
        .send({
          prerequisites: [movieB._id.toString()],
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CIRCULAR_DEPENDENCY');

      // Verify Movie A prerequisites remain empty
      const checkA = await Movie.findById(movieA._id);
      expect(checkA?.prerequisites).toEqual([]);
    });

    it('rejects multi-node indirect circular dependency (A -> B -> C -> A) with 409', async () => {
      // Setup chain: C depends on B, B depends on A
      const movieA = await Movie.create({
        title: 'Movie A',
        normalizedTitle: 'movie a',
        releaseYear: 2010,
        runtime: 100,
        prerequisites: [],
      });
      const movieB = await Movie.create({
        title: 'Movie B',
        normalizedTitle: 'movie b',
        releaseYear: 2011,
        runtime: 105,
        prerequisites: [movieA._id],
      });
      const movieC = await Movie.create({
        title: 'Movie C',
        normalizedTitle: 'movie c',
        releaseYear: 2012,
        runtime: 110,
        prerequisites: [movieB._id],
      });

      // Attempt to make A depend on C -> forms A -> C -> B -> A cycle
      const res = await request(app)
        .patch(`/api/movies/${movieA._id}`)
        .send({
          prerequisites: [movieC._id.toString()],
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CIRCULAR_DEPENDENCY');

      // Verify Movie A prerequisites remain empty
      const checkA = await Movie.findById(movieA._id);
      expect(checkA?.prerequisites).toEqual([]);
    });

    it('ensures rejected cycle updates with other field changes leave entire document unchanged', async () => {
      const movieA = await Movie.create({
        title: 'Movie A',
        normalizedTitle: 'movie a',
        releaseYear: 2010,
        runtime: 100,
        watched: false,
        prerequisites: [],
      });
      const movieB = await Movie.create({
        title: 'Movie B',
        normalizedTitle: 'movie b',
        releaseYear: 2012,
        runtime: 110,
        prerequisites: [movieA._id],
      });

      // Attempt to update A with new title/runtime and a cycle prerequisite
      const res = await request(app)
        .patch(`/api/movies/${movieA._id}`)
        .send({
          title: 'Modified A',
          runtime: 180,
          watched: true,
          prerequisites: [movieB._id.toString()],
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CIRCULAR_DEPENDENCY');

      // Verify entire document is unmodified
      const afterRes = await Movie.findById(movieA._id);
      expect(afterRes?.title).toBe('Movie A');
      expect(afterRes?.runtime).toBe(100);
      expect(afterRes?.watched).toBe(false);
      expect(afterRes?.prerequisites).toEqual([]);
    });

    it('rejects duplicate prerequisite references on update (400)', async () => {
      const movieA = await Movie.create({
        title: 'Movie A',
        normalizedTitle: 'movie a',
        releaseYear: 2010,
        runtime: 100,
      });
      const movieB = await Movie.create({
        title: 'Movie B',
        normalizedTitle: 'movie b',
        releaseYear: 2012,
        runtime: 110,
      });

      const res = await request(app)
        .patch(`/api/movies/${movieB._id}`)
        .send({
          prerequisites: [movieA._id.toString(), movieA._id.toString()],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects nonexistent prerequisite references on update (400)', async () => {
      const movie = await Movie.create({
        title: 'Movie A',
        normalizedTitle: 'movie a',
        releaseYear: 2010,
        runtime: 100,
      });
      const nonexistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/movies/${movie._id}`)
        .send({
          prerequisites: [nonexistentId],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_PREREQUISITE');
    });

    it('returns 404 when updating non-existent movie ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/movies/${nonExistentId}`)
        .send({ title: 'New Title' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('rejects malformed ID in route params (400)', async () => {
      const res = await request(app)
        .patch('/api/movies/not-a-valid-id')
        .send({ title: 'New Title' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects empty update payload (400)', async () => {
      const movie = await Movie.create({
        title: 'Movie A',
        normalizedTitle: 'movie a',
        releaseYear: 2010,
        runtime: 100,
      });

      const res = await request(app).patch(`/api/movies/${movie._id}`).send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects update that would create a duplicate normalized title (409)', async () => {
      await Movie.create({
        title: 'Iron Man',
        normalizedTitle: 'iron man',
        releaseYear: 2008,
        runtime: 126,
      });
      const movie2 = await Movie.create({
        title: 'Thor',
        normalizedTitle: 'thor',
        releaseYear: 2011,
        runtime: 115,
      });

      const res = await request(app).patch(`/api/movies/${movie2._id}`).send({
        title: '  iron man  ',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_TITLE');
    });
  });

  describe('GET /api/movies/:id/rewatch-order', () => {
    it('returns empty list and 0 counts/runtime for a movie with no prerequisites', async () => {
      const ironMan = await Movie.create({
        title: 'Iron Man',
        normalizedTitle: 'iron man',
        releaseYear: 2008,
        runtime: 126,
        watched: true,
        prerequisites: [],
      });

      const res = await request(app).get(`/api/movies/${ironMan._id}/rewatch-order`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.targetMovie.title).toBe('Iron Man');
      expect(res.body.data.prerequisites).toEqual([]);
      expect(res.body.data.totalPrerequisites).toBe(0);
      expect(res.body.data.watchedPrerequisites).toBe(0);
      expect(res.body.data.unwatchedRuntime).toBe(0);
    });

    it('returns correct prerequisite-first topological order for a simple chain', async () => {
      // Chain: Iron Man (2008) -> Captain America (2011) -> The Avengers (2012)
      const ironMan = await Movie.create({
        title: 'Iron Man',
        normalizedTitle: 'iron man',
        releaseYear: 2008,
        runtime: 126,
        watched: true,
        prerequisites: [],
      });
      const captainAmerica = await Movie.create({
        title: 'Captain America: The First Avenger',
        normalizedTitle: 'captain america: the first avenger',
        releaseYear: 2011,
        runtime: 124,
        watched: false,
        prerequisites: [ironMan._id],
      });
      const theAvengers = await Movie.create({
        title: 'The Avengers',
        normalizedTitle: 'the avengers',
        releaseYear: 2012,
        runtime: 143,
        watched: false,
        prerequisites: [captainAmerica._id],
      });

      const res = await request(app).get(`/api/movies/${theAvengers._id}/rewatch-order`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const {
        targetMovie,
        prerequisites,
        totalPrerequisites,
        watchedPrerequisites,
        unwatchedRuntime,
      } = res.body.data;

      // Target movie is The Avengers
      expect(targetMovie.title).toBe('The Avengers');

      // Target movie is excluded from prerequisites list
      expect(prerequisites.some((m: { title: string }) => m.title === 'The Avengers')).toBe(false);

      // Total count
      expect(totalPrerequisites).toBe(2);
      expect(prerequisites).toHaveLength(2);

      // Prerequisite-first order: Iron Man MUST appear before Captain America
      expect(prerequisites[0].title).toBe('Iron Man');
      expect(prerequisites[1].title).toBe('Captain America: The First Avenger');

      // Watched statistics: Iron Man is watched (1), Captain America is unwatched (0)
      expect(watchedPrerequisites).toBe(1);
      // Unwatched runtime: only Captain America (124 minutes)
      expect(unwatchedRuntime).toBe(124);
    });

    it('returns multiple independent prerequisites correctly ordered before dependent movies', async () => {
      // Iron Man and Thor are independent; Avengers requires both
      const ironMan = await Movie.create({
        title: 'Iron Man',
        normalizedTitle: 'iron man',
        releaseYear: 2008,
        runtime: 126,
        watched: true,
        prerequisites: [],
      });
      const thor = await Movie.create({
        title: 'Thor',
        normalizedTitle: 'thor',
        releaseYear: 2011,
        runtime: 115,
        watched: true,
        prerequisites: [],
      });
      const avengers = await Movie.create({
        title: 'The Avengers',
        normalizedTitle: 'the avengers',
        releaseYear: 2012,
        runtime: 143,
        watched: false,
        prerequisites: [ironMan._id, thor._id],
      });

      const res = await request(app).get(`/api/movies/${avengers._id}/rewatch-order`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalPrerequisites).toBe(2);
      const titles = res.body.data.prerequisites.map((m: { title: string }) => m.title);
      expect(titles).toContain('Iron Man');
      expect(titles).toContain('Thor');
      expect(titles).not.toContain('The Avengers');
      expect(res.body.data.watchedPrerequisites).toBe(2);
      expect(res.body.data.unwatchedRuntime).toBe(0);
    });

    it('handles diamond DAG with shared prerequisites appearing only once in valid order', async () => {
      // Graph:
      // Iron Man (IM)
      // Civil War (CW) -> [IM]
      // Spider-Man: Homecoming (SM) -> [IM, CW]
      // Infinity War (IW) -> [CW, SM]
      const im = await Movie.create({
        title: 'Iron Man',
        normalizedTitle: 'iron man',
        releaseYear: 2008,
        runtime: 126,
        watched: true,
        prerequisites: [],
      });
      const cw = await Movie.create({
        title: 'Captain America: Civil War',
        normalizedTitle: 'captain america: civil war',
        releaseYear: 2016,
        runtime: 147,
        watched: false,
        prerequisites: [im._id],
      });
      const sm = await Movie.create({
        title: 'Spider-Man: Homecoming',
        normalizedTitle: 'spider-man: homecoming',
        releaseYear: 2017,
        runtime: 133,
        watched: false,
        prerequisites: [im._id, cw._id],
      });
      const iw = await Movie.create({
        title: 'Avengers: Infinity War',
        normalizedTitle: 'avengers: infinity war',
        releaseYear: 2018,
        runtime: 149,
        watched: false,
        prerequisites: [cw._id, sm._id],
      });

      const res = await request(app).get(`/api/movies/${iw._id}/rewatch-order`);

      expect(res.status).toBe(200);
      const { prerequisites, totalPrerequisites, watchedPrerequisites, unwatchedRuntime } =
        res.body.data;

      // Infinity War excluded
      expect(totalPrerequisites).toBe(3);
      expect(prerequisites).toHaveLength(3);

      const titles = prerequisites.map((m: { title: string }) => m.title);

      // Shared prerequisite Iron Man must appear exactly once
      expect(titles.filter((t: string) => t === 'Iron Man')).toHaveLength(1);

      // Check valid topological ordering:
      // Iron Man before Civil War
      expect(titles.indexOf('Iron Man')).toBeLessThan(titles.indexOf('Captain America: Civil War'));
      // Civil War before Spider-Man
      expect(titles.indexOf('Captain America: Civil War')).toBeLessThan(
        titles.indexOf('Spider-Man: Homecoming'),
      );

      // Watched statistics: Iron Man is watched (1), Civil War (147) & Spider-Man (133) unwatched
      expect(watchedPrerequisites).toBe(1);
      expect(unwatchedRuntime).toBe(147 + 133);
    });

    it('accurately computes rewatch statistics with mixed watched statuses, shared prerequisites, and target exclusion', async () => {
      // Realistic MCU test setup:
      // 1. Iron Man (2008, 126 min, watched: true)
      // 2. Captain America: The First Avenger (2011, 124 min, watched: true)
      // 3. The Avengers (2012, 143 min, watched: false) -> prereqs: [Iron Man, The First Avenger]
      // 4. Thor: Ragnarok (2017, 130 min, watched: true) -> prereqs: [The Avengers]
      // 5. Captain America: Civil War (2016, 147 min, watched: false) -> prereqs: [The Avengers, The First Avenger] (shared!)
      // 6. Target: Avengers: Infinity War (2018, 149 min, watched: true) -> prereqs: [Civil War, Thor: Ragnarok]
      const ironMan = await Movie.create({
        title: 'Iron Man',
        normalizedTitle: 'iron man',
        releaseYear: 2008,
        runtime: 126,
        watched: true,
        prerequisites: [],
      });
      const firstAvenger = await Movie.create({
        title: 'Captain America: The First Avenger',
        normalizedTitle: 'captain america: the first avenger',
        releaseYear: 2011,
        runtime: 124,
        watched: true,
        prerequisites: [],
      });
      const theAvengers = await Movie.create({
        title: 'The Avengers',
        normalizedTitle: 'the avengers',
        releaseYear: 2012,
        runtime: 143,
        watched: false,
        prerequisites: [ironMan._id, firstAvenger._id],
      });
      const ragnarok = await Movie.create({
        title: 'Thor: Ragnarok',
        normalizedTitle: 'thor: ragnarok',
        releaseYear: 2017,
        runtime: 130,
        watched: true,
        prerequisites: [theAvengers._id],
      });
      const civilWar = await Movie.create({
        title: 'Captain America: Civil War',
        normalizedTitle: 'captain america: civil war',
        releaseYear: 2016,
        runtime: 147,
        watched: false,
        prerequisites: [theAvengers._id, firstAvenger._id],
      });
      const infinityWar = await Movie.create({
        title: 'Avengers: Infinity War',
        normalizedTitle: 'avengers: infinity war',
        releaseYear: 2018,
        runtime: 149,
        watched: true, // Target movie itself is watched; must be excluded from calculations!
        prerequisites: [civilWar._id, ragnarok._id],
      });

      const res = await request(app).get(`/api/movies/${infinityWar._id}/rewatch-order`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const {
        targetMovie,
        prerequisites,
        totalPrerequisites,
        watchedPrerequisites,
        unwatchedRuntime,
      } = res.body.data;

      // 1. Verify target movie
      expect(targetMovie.title).toBe('Avengers: Infinity War');
      expect(targetMovie.watched).toBe(true);
      expect(targetMovie.runtime).toBe(149);

      // 2. Verify target movie is EXCLUDED from prerequisites list
      const prereqIds = prerequisites.map((m: { _id: string }) => m._id.toString());
      expect(prereqIds).not.toContain(infinityWar._id.toString());

      // 3. Verify exactly 5 transitive prerequisites exist
      // [Iron Man, The First Avenger, The Avengers, Civil War, Thor: Ragnarok]
      expect(totalPrerequisites).toBe(5);
      expect(prerequisites).toHaveLength(5);

      // 4. Verify shared prerequisites (Iron Man, The First Avenger, The Avengers) appear only once
      const prereqTitles = prerequisites.map((m: { title: string }) => m.title);
      expect(prereqTitles.filter((t: string) => t === 'Iron Man')).toHaveLength(1);
      expect(
        prereqTitles.filter((t: string) => t === 'Captain America: The First Avenger'),
      ).toHaveLength(1);
      expect(prereqTitles.filter((t: string) => t === 'The Avengers')).toHaveLength(1);

      // 5. Verify the returned list contains both watched and unwatched movies
      const watchedInList = prerequisites.filter((m: { watched: boolean }) => m.watched);
      const unwatchedInList = prerequisites.filter((m: { watched: boolean }) => !m.watched);
      expect(watchedInList.length).toBeGreaterThan(0);
      expect(unwatchedInList.length).toBeGreaterThan(0);

      // Specifically: Iron Man (true), The First Avenger (true), Thor: Ragnarok (true) => 3 watched
      // The Avengers (false), Civil War (false) => 2 unwatched
      expect(watchedInList).toHaveLength(3);
      expect(unwatchedInList).toHaveLength(2);

      // 6. Verify watchedPrerequisites equals the actual number of watched movies in the returned list
      // Target movie's watched status (true) must NOT be counted (would be 4 if counted)
      expect(watchedPrerequisites).toBe(3);
      expect(watchedPrerequisites).toBe(watchedInList.length);

      // 7. Verify unwatchedRuntime equals the sum of runtimes of only the unwatched prerequisites
      // The Avengers (143) + Civil War (147) = 290 minutes.
      // Target movie's runtime (149) must NOT be counted.
      const expectedUnwatchedRuntime = 143 + 147; // 290
      expect(unwatchedRuntime).toBe(expectedUnwatchedRuntime);
      expect(unwatchedRuntime).toBe(
        unwatchedInList.reduce((sum: number, m: { runtime: number }) => sum + m.runtime, 0),
      );

      // 8. Verify topological ordering:
      // Iron Man and First Avenger must precede The Avengers
      expect(prereqTitles.indexOf('Iron Man')).toBeLessThan(prereqTitles.indexOf('The Avengers'));
      expect(prereqTitles.indexOf('Captain America: The First Avenger')).toBeLessThan(
        prereqTitles.indexOf('The Avengers'),
      );
      // The Avengers must precede Thor: Ragnarok and Civil War
      expect(prereqTitles.indexOf('The Avengers')).toBeLessThan(
        prereqTitles.indexOf('Thor: Ragnarok'),
      );
      expect(prereqTitles.indexOf('The Avengers')).toBeLessThan(
        prereqTitles.indexOf('Captain America: Civil War'),
      );
    });

    it('rejects invalid ObjectId route parameter (400)', async () => {
      const res = await request(app).get('/api/movies/invalid-id/rewatch-order');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 for nonexistent movie ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app).get(`/api/movies/${nonExistentId}/rewatch-order`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
