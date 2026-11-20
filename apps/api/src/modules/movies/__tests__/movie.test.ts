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

describe('Movie API — Phase 2', () => {
  describe('POST /api/movies', () => {
    it('creates a movie successfully with valid data', async () => {
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
      expect(res.body.data.createdAt).toBeDefined();
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

      // Different casing and whitespace
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

  describe('PATCH /api/movies/:id', () => {
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

    it('temporarily rejects prerequisite updates in Phase 2 with a clear error explaining Phase 3 availability', async () => {
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
        prerequisites: [],
      });

      const res = await request(app)
        .patch(`/api/movies/${movieB._id}`)
        .send({
          prerequisites: [movieA._id.toString()],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PREREQUISITE_UPDATE_DISABLED');
      expect(res.body.error.message).toMatch(/Phase 3/i);

      // Verify that original prerequisites remain unchanged after rejection
      const movieAfter = await Movie.findById(movieB._id);
      expect(movieAfter?.prerequisites).toEqual([]);
    });

    it('ensures rejection of prerequisite updates leaves existing non-empty prerequisites unchanged', async () => {
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
        prerequisites: [movieA._id],
      });

      // Attempt to clear or change prerequisites
      const res = await request(app).patch(`/api/movies/${movieB._id}`).send({
        prerequisites: [],
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PREREQUISITE_UPDATE_DISABLED');

      // Verify original prerequisites are still intact
      const movieBAfter = await Movie.findById(movieB._id);
      expect(movieBAfter?.prerequisites).toHaveLength(1);
      expect(movieBAfter?.prerequisites[0].toString()).toBe(movieA._id.toString());
    });

    it('ensures attempted prerequisite updates with other field changes leave entire document unchanged', async () => {
      const originalMovie = await Movie.create({
        title: 'Original Title',
        normalizedTitle: 'original title',
        releaseYear: 2015,
        runtime: 120,
        watched: false,
        prerequisites: [],
      });

      const res = await request(app)
        .patch(`/api/movies/${originalMovie._id}`)
        .send({
          title: 'Modified Title',
          runtime: 180,
          watched: true,
          prerequisites: [new mongoose.Types.ObjectId().toString()],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PREREQUISITE_UPDATE_DISABLED');

      // Verify document is completely unmodified
      const afterRes = await Movie.findById(originalMovie._id);
      expect(afterRes?.title).toBe('Original Title');
      expect(afterRes?.runtime).toBe(120);
      expect(afterRes?.watched).toBe(false);
      expect(afterRes?.prerequisites).toEqual([]);
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
});
