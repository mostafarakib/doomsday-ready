import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../../app.js';
import { Cinema } from '../../cinemas/cinema.model.js';
import { Booking } from '../booking.model.js';

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
  await Booking.deleteMany({});
  await Cinema.deleteMany({});
});

describe('Booking API — Phase 5: Persistence & Backend Completion', () => {
  describe('POST /api/bookings', () => {
    it('creates and persists a booking plan with server-calculated values (201 Created)', async () => {
      const cinema = await Cinema.create({
        name: 'Odeon Luxe Leicester Square',
        normalizedName: 'odeon luxe leicester square',
        bundleSizes: [1, 3, 4],
      });

      const res = await request(app).post('/api/bookings').send({
        cinemaId: cinema._id.toString(),
        groupSize: 6,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBeDefined();
      expect(res.body.data.cinema).toBe(cinema._id.toString());
      expect(res.body.data.cinemaName).toBe('Odeon Luxe Leicester Square');
      expect(res.body.data.groupSize).toBe(6);
      expect(res.body.data.bundleSizes).toEqual([1, 3, 4]);
      expect(res.body.data.bundleBreakdown).toEqual([{ size: 3, quantity: 2 }]);
      expect(res.body.data.totalBundles).toBe(2);
      expect(res.body.data.totalSeats).toBe(6);
      expect(res.body.data.status).toBe('saved');
      expect(res.body.data.createdAt).toBeDefined();
      expect(res.body.data.updatedAt).toBeDefined();

      // Verify persistence in MongoDB
      const persisted = await Booking.findById(res.body.data._id);
      expect(persisted).not.toBeNull();
      expect(persisted?.totalBundles).toBe(2);
      expect(persisted?.totalSeats).toBe(6);
      expect(persisted?.cinemaName).toBe('Odeon Luxe Leicester Square');
      expect(persisted?.status).toBe('saved');
    });

    it('accepts cinema field as alternative alias for cinemaId', async () => {
      const cinema = await Cinema.create({
        name: 'BFI IMAX',
        normalizedName: 'bfi imax',
        bundleSizes: [2, 5],
      });

      const res = await request(app).post('/api/bookings').send({
        cinema: cinema._id.toString(),
        groupSize: 11,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalBundles).toBe(4);
      expect(res.body.data.totalSeats).toBe(11);
      expect(res.body.data.bundleBreakdown).toEqual([
        { size: 5, quantity: 1 },
        { size: 2, quantity: 3 },
      ]);
    });

    it('rejects impossible quotes and does not persist any booking document (400 IMPOSSIBLE_BOOKING)', async () => {
      const cinema = await Cinema.create({
        name: 'Even Only Cinema',
        normalizedName: 'even only cinema',
        bundleSizes: [4, 6],
      });

      const res = await request(app).post('/api/bookings').send({
        cinemaId: cinema._id.toString(),
        groupSize: 7,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('IMPOSSIBLE_BOOKING');
      expect(res.body.error.message).toContain('No exact bundle combination exists');

      // Ensure no booking document was saved
      const count = await Booking.countDocuments();
      expect(count).toBe(0);
    });

    it('ensures client-supplied calculated fields cannot manipulate persisted results', async () => {
      const cinema = await Cinema.create({
        name: 'Authentic Cinema',
        normalizedName: 'authentic cinema',
        bundleSizes: [1, 3, 4],
      });

      // Attempt to spoof totals, seat count, status, cinema name, and breakdown
      const res = await request(app)
        .post('/api/bookings')
        .send({
          cinemaId: cinema._id.toString(),
          groupSize: 6,
          totalBundles: 999,
          totalSeats: 999,
          cinemaName: 'Hacked Cinema Name',
          bundleBreakdown: [{ size: 100, quantity: 100 }],
          bundleSizes: [100],
          status: 'confirmed',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // Confirms all values were recalculated and resolved exclusively by the server
      expect(res.body.data.cinemaName).toBe('Authentic Cinema');
      expect(res.body.data.totalBundles).toBe(2);
      expect(res.body.data.totalSeats).toBe(6);
      expect(res.body.data.bundleSizes).toEqual([1, 3, 4]);
      expect(res.body.data.bundleBreakdown).toEqual([{ size: 3, quantity: 2 }]);
      expect(res.body.data.status).toBe('saved');

      const persisted = await Booking.findById(res.body.data._id);
      expect(persisted?.totalBundles).toBe(2);
      expect(persisted?.totalSeats).toBe(6);
      expect(persisted?.cinemaName).toBe('Authentic Cinema');
      expect(persisted?.status).toBe('saved');
    });

    it('rejects missing cinema ID (400 Bad Request)', async () => {
      const res = await request(app).post('/api/bookings').send({
        groupSize: 6,
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects malformed cinema ID (400 Bad Request)', async () => {
      const res = await request(app).post('/api/bookings').send({
        cinemaId: 'invalid-object-id',
        groupSize: 6,
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 NOT_FOUND for nonexistent cinema ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app).post('/api/bookings').send({
        cinemaId: nonExistentId,
        groupSize: 6,
      });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('rejects missing or invalid groupSize parameters (400 Bad Request)', async () => {
      const cinema = await Cinema.create({
        name: 'Validation Cinema',
        normalizedName: 'validation cinema',
        bundleSizes: [2, 5],
      });

      // Missing
      const resMissing = await request(app).post('/api/bookings').send({
        cinemaId: cinema._id.toString(),
      });
      expect(resMissing.status).toBe(400);
      expect(resMissing.body.error.code).toBe('VALIDATION_ERROR');

      // Zero
      const resZero = await request(app).post('/api/bookings').send({
        cinemaId: cinema._id.toString(),
        groupSize: 0,
      });
      expect(resZero.status).toBe(400);
      expect(resZero.body.error.code).toBe('VALIDATION_ERROR');

      // Negative
      const resNegative = await request(app).post('/api/bookings').send({
        cinemaId: cinema._id.toString(),
        groupSize: -10,
      });
      expect(resNegative.status).toBe(400);
      expect(resNegative.body.error.code).toBe('VALIDATION_ERROR');

      // Exceeding 10000
      const resTooLarge = await request(app).post('/api/bookings').send({
        cinemaId: cinema._id.toString(),
        groupSize: 10001,
      });
      expect(resTooLarge.status).toBe(400);
      expect(resTooLarge.body.error.code).toBe('VALIDATION_ERROR');

      // Float
      const resFloat = await request(app).post('/api/bookings').send({
        cinemaId: cinema._id.toString(),
        groupSize: 5.5,
      });
      expect(resFloat.status).toBe(400);
      expect(resFloat.body.error.code).toBe('VALIDATION_ERROR');

      // Non-number
      const resString = await request(app).post('/api/bookings').send({
        cinemaId: cinema._id.toString(),
        groupSize: 'ten',
      });
      expect(resString.status).toBe(400);
      expect(resString.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Snapshot preservation', () => {
    it('preserves cinema name and bundle sizes in existing bookings when cinema details change later', async () => {
      // 1. Create initial cinema
      const cinema = await Cinema.create({
        name: 'Picturehouse Central',
        normalizedName: 'picturehouse central',
        bundleSizes: [2, 5],
      });

      // 2. Create booking snapshot
      const bookingRes = await request(app).post('/api/bookings').send({
        cinemaId: cinema._id.toString(),
        groupSize: 11,
      });
      expect(bookingRes.status).toBe(201);
      const bookingId = bookingRes.body.data._id;

      // 3. Mutate the cinema record directly (e.g. rebranding and seat restructuring)
      await Cinema.findByIdAndUpdate(cinema._id, {
        name: 'Cineworld Central London',
        normalizedName: 'cineworld central london',
        bundleSizes: [10, 20],
      });

      // 4. Retrieve bookings list
      const listRes = await request(app).get('/api/bookings');
      expect(listRes.status).toBe(200);

      const targetBooking = listRes.body.data.find((b: { _id: string }) => b._id === bookingId);
      expect(targetBooking).toBeDefined();

      // Snapshot values must remain identical to time of booking
      expect(targetBooking.cinemaName).toBe('Picturehouse Central');
      expect(targetBooking.bundleSizes).toEqual([2, 5]);
      expect(targetBooking.bundleBreakdown).toEqual([
        { size: 5, quantity: 1 },
        { size: 2, quantity: 3 },
      ]);
      expect(targetBooking.totalBundles).toBe(4);
      expect(targetBooking.totalSeats).toBe(11);
    });

    it('preserves saved booking snapshot even if the cinema is deleted from the database', async () => {
      // 1. Create cinema
      const cinema = await Cinema.create({
        name: 'The Electric Cinema',
        normalizedName: 'the electric cinema',
        bundleSizes: [3, 4],
      });

      // 2. Create booking snapshot
      const bookingRes = await request(app).post('/api/bookings').send({
        cinemaId: cinema._id.toString(),
        groupSize: 7,
      });
      expect(bookingRes.status).toBe(201);
      const bookingId = bookingRes.body.data._id;

      // 3. Delete the cinema record completely
      await Cinema.findByIdAndDelete(cinema._id);

      // Verify cinema is indeed gone
      const deletedCinema = await Cinema.findById(cinema._id);
      expect(deletedCinema).toBeNull();

      // 4. Retrieve bookings list
      const listRes = await request(app).get('/api/bookings');
      expect(listRes.status).toBe(200);

      const targetBooking = listRes.body.data.find((b: { _id: string }) => b._id === bookingId);
      expect(targetBooking).toBeDefined();

      // Snapshot values remain intact
      expect(targetBooking.cinemaName).toBe('The Electric Cinema');
      expect(targetBooking.bundleSizes).toEqual([3, 4]);
      expect(targetBooking.bundleBreakdown).toEqual([
        { size: 4, quantity: 1 },
        { size: 3, quantity: 1 },
      ]);
      expect(targetBooking.totalBundles).toBe(2);
      expect(targetBooking.totalSeats).toBe(7);
      expect(targetBooking.status).toBe('saved');
    });
  });

  describe('GET /api/bookings', () => {
    it('returns an empty array when no bookings have been saved', async () => {
      const res = await request(app).get('/api/bookings');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('returns saved bookings sorted newest first', async () => {
      const cinema = await Cinema.create({
        name: 'Curzon Mayfair',
        normalizedName: 'curzon mayfair',
        bundleSizes: [1, 3],
      });

      // Create first booking
      const res1 = await request(app).post('/api/bookings').send({
        cinemaId: cinema._id.toString(),
        groupSize: 3,
      });
      expect(res1.status).toBe(201);

      // Small delay to ensure timestamp separation
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Create second booking
      const res2 = await request(app).post('/api/bookings').send({
        cinemaId: cinema._id.toString(),
        groupSize: 4,
      });
      expect(res2.status).toBe(201);

      const listRes = await request(app).get('/api/bookings');

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      expect(listRes.body.data.length).toBe(2);

      // First item in array must be the most recently created booking
      expect(listRes.body.data[0]._id).toBe(res2.body.data._id);
      expect(listRes.body.data[1]._id).toBe(res1.body.data._id);
    });
  });
});
