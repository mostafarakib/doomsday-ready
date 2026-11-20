import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../../app.js';
import { Cinema } from '../cinema.model.js';

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
  await Cinema.deleteMany({});
});

describe('Cinema API — Phase 4: CRUD & Minimum-Bundle Quote', () => {
  describe('POST /api/cinemas', () => {
    it('creates a cinema successfully with valid inputs', async () => {
      const payload = {
        name: 'Odeon Luxe Leicester Square',
        bundleSizes: [2, 4, 6],
      };

      const res = await request(app).post('/api/cinemas').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Odeon Luxe Leicester Square');
      expect(res.body.data.normalizedName).toBe('odeon luxe leicester square');
      expect(res.body.data.bundleSizes).toEqual([2, 4, 6]);
      expect(res.body.data._id).toBeDefined();
      expect(mongoose.Types.ObjectId.isValid(res.body.data._id)).toBe(true);
      expect(res.body.data.createdAt).toBeDefined();
      expect(res.body.data.updatedAt).toBeDefined();
    });

    it('trims whitespace and enforces case-insensitive uniqueness (409 DUPLICATE_NAME)', async () => {
      await request(app)
        .post('/api/cinemas')
        .send({
          name: 'Vue Westfield',
          bundleSizes: [1, 3, 5],
        });

      // Attempt creating with different casing and extra padding
      const res = await request(app)
        .post('/api/cinemas')
        .send({
          name: '  vue WESTFIELD  ',
          bundleSizes: [2, 4],
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_NAME');
      expect(res.body.error.message).toContain('already exists');
    });

    it('rejects empty or whitespace-only cinema name (400 Bad Request)', async () => {
      const resEmpty = await request(app)
        .post('/api/cinemas')
        .send({
          name: '',
          bundleSizes: [2, 4],
        });
      expect(resEmpty.status).toBe(400);
      expect(resEmpty.body.error.code).toBe('VALIDATION_ERROR');

      const resWhitespace = await request(app)
        .post('/api/cinemas')
        .send({
          name: '    ',
          bundleSizes: [2, 4],
        });
      expect(resWhitespace.status).toBe(400);
      expect(resWhitespace.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects missing cinema name (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/cinemas')
        .send({
          bundleSizes: [2, 4],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects empty bundleSizes array (400 Bad Request)', async () => {
      const res = await request(app).post('/api/cinemas').send({
        name: 'Empty Bundles Cinema',
        bundleSizes: [],
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects more than 10 bundle sizes (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/cinemas')
        .send({
          name: 'Too Many Bundles Cinema',
          bundleSizes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects duplicate bundle sizes within the array (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/cinemas')
        .send({
          name: 'Duplicate Bundles Cinema',
          bundleSizes: [2, 4, 4, 8],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Duplicate bundle sizes');
    });

    it('rejects bundle sizes outside the 1-500 range (400 Bad Request)', async () => {
      const resZero = await request(app)
        .post('/api/cinemas')
        .send({
          name: 'Zero Bundle Cinema',
          bundleSizes: [0, 5],
        });
      expect(resZero.status).toBe(400);
      expect(resZero.body.error.code).toBe('VALIDATION_ERROR');

      const resTooLarge = await request(app)
        .post('/api/cinemas')
        .send({
          name: 'Huge Bundle Cinema',
          bundleSizes: [5, 501],
        });
      expect(resTooLarge.status).toBe(400);
      expect(resTooLarge.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects non-integer bundle sizes (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/cinemas')
        .send({
          name: 'Float Bundle Cinema',
          bundleSizes: [2, 3.5],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects unexpected fields in body (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/cinemas')
        .send({
          name: 'Strict Cinema',
          bundleSizes: [2, 4],
          unknownField: 'malicious',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/cinemas', () => {
    it('returns an empty array when no cinemas exist', async () => {
      const res = await request(app).get('/api/cinemas');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('lists all created cinemas sorted by name', async () => {
      await Cinema.create([
        {
          name: 'Z Cinema',
          normalizedName: 'z cinema',
          bundleSizes: [5],
        },
        {
          name: 'A Cinema',
          normalizedName: 'a cinema',
          bundleSizes: [2, 4],
        },
      ]);

      const res = await request(app).get('/api/cinemas');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].name).toBe('A Cinema');
      expect(res.body.data[1].name).toBe('Z Cinema');
    });
  });

  describe('GET /api/cinemas/:id/booking?groupSize=X', () => {
    it('returns an optimal quote when an exact combination is possible', async () => {
      const cinema = await Cinema.create({
        name: 'Grand IMAX',
        normalizedName: 'grand imax',
        bundleSizes: [1, 3, 4],
      });

      const res = await request(app).get(`/api/cinemas/${cinema._id}/booking?groupSize=6`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        cinemaId: cinema._id.toString(),
        cinemaName: 'Grand IMAX',
        groupSize: 6,
        possible: true,
        totalBundles: 2,
        totalSeats: 6,
        bundleBreakdown: [{ size: 3, quantity: 2 }],
      });
    });

    it('returns possible: false when no exact combination is possible (status 200)', async () => {
      const cinema = await Cinema.create({
        name: 'Even Only Cinema',
        normalizedName: 'even only cinema',
        bundleSizes: [4, 6],
      });

      const res = await request(app).get(`/api/cinemas/${cinema._id}/booking?groupSize=7`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        cinemaId: cinema._id.toString(),
        cinemaName: 'Even Only Cinema',
        groupSize: 7,
        possible: false,
      });
    });

    it('handles tie-breaking correctly by preferring larger bundles at first point of difference', async () => {
      const cinema = await Cinema.create({
        name: 'Tie Breaker Cinema',
        normalizedName: 'tie breaker cinema',
        bundleSizes: [4, 3, 2],
      });

      // 6 can be 4 + 2 (2 bundles) or 3 + 3 (2 bundles)
      // Prefers [4, 2]
      const res = await request(app).get(`/api/cinemas/${cinema._id}/booking?groupSize=6`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.possible).toBe(true);
      expect(res.body.data.totalBundles).toBe(2);
      expect(res.body.data.bundleBreakdown).toEqual([
        { size: 4, quantity: 1 },
        { size: 2, quantity: 1 },
      ]);
    });

    it('rejects missing groupSize parameter (400 Bad Request)', async () => {
      const cinema = await Cinema.create({
        name: 'Any Cinema',
        normalizedName: 'any cinema',
        bundleSizes: [2, 5],
      });

      const res = await request(app).get(`/api/cinemas/${cinema._id}/booking`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects groupSize less than 1 (400 Bad Request)', async () => {
      const cinema = await Cinema.create({
        name: 'Any Cinema',
        normalizedName: 'any cinema',
        bundleSizes: [2, 5],
      });

      const res = await request(app).get(`/api/cinemas/${cinema._id}/booking?groupSize=0`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects groupSize exceeding 10,000 (400 Bad Request)', async () => {
      const cinema = await Cinema.create({
        name: 'Any Cinema',
        normalizedName: 'any cinema',
        bundleSizes: [2, 5],
      });

      const res = await request(app).get(`/api/cinemas/${cinema._id}/booking?groupSize=10001`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects non-integer groupSize (400 Bad Request)', async () => {
      const cinema = await Cinema.create({
        name: 'Any Cinema',
        normalizedName: 'any cinema',
        bundleSizes: [2, 5],
      });

      const res = await request(app).get(`/api/cinemas/${cinema._id}/booking?groupSize=6.5`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects non-numeric groupSize (400 Bad Request)', async () => {
      const cinema = await Cinema.create({
        name: 'Any Cinema',
        normalizedName: 'any cinema',
        bundleSizes: [2, 5],
      });

      const res = await request(app).get(`/api/cinemas/${cinema._id}/booking?groupSize=abc`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 NOT_FOUND for nonexistent cinema ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app).get(`/api/cinemas/${nonExistentId}/booking?groupSize=6`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 VALIDATION_ERROR for malformed cinema ID', async () => {
      const res = await request(app).get('/api/cinemas/not-a-valid-id/booking?groupSize=6');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
