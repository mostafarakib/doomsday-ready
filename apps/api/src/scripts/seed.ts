import dotenv from 'dotenv';
import path from 'node:path';
import mongoose from 'mongoose';
import { Movie } from '../modules/movies/movie.model.js';
import { Cinema } from '../modules/cinemas/cinema.model.js';

// Load .env from apps/api/.env or current working directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/doomsday_ready';

// Assessment MCU Movies
const MCU_MOVIES = [
  {
    title: 'Iron Man',
    releaseYear: 2008,
    runtime: 126,
    watched: true,
    prereqTitles: [],
  },
  {
    title: 'Captain America: The First Avenger',
    releaseYear: 2011,
    runtime: 124,
    watched: true,
    prereqTitles: [],
  },
  {
    title: 'The Avengers',
    releaseYear: 2012,
    runtime: 143,
    watched: true,
    prereqTitles: ['Iron Man', 'Captain America: The First Avenger'],
  },
  {
    title: 'Captain America: Civil War',
    releaseYear: 2016,
    runtime: 147,
    watched: true,
    prereqTitles: ['The Avengers', 'Captain America: The First Avenger'],
  },
  {
    title: 'Thor: Ragnarok',
    releaseYear: 2017,
    runtime: 130,
    watched: true,
    prereqTitles: ['The Avengers'],
  },
  {
    title: 'Avengers: Infinity War',
    releaseYear: 2018,
    runtime: 149,
    watched: false,
    prereqTitles: ['Captain America: Civil War', 'Thor: Ragnarok'],
  },
  {
    title: 'Avengers: Endgame',
    releaseYear: 2019,
    runtime: 181,
    watched: false,
    prereqTitles: ['Avengers: Infinity War'],
  },
  {
    title: 'Avengers: Doomsday',
    releaseYear: 2026,
    runtime: 180,
    watched: false,
    prereqTitles: ['Avengers: Endgame'],
  },
];

// Assessment Sample Cinemas
const SAMPLE_CINEMAS = [
  {
    name: 'Odeon Luxe Leicester Square',
    bundleSizes: [1, 3, 4],
  },
  {
    name: 'BFI IMAX Waterloo',
    bundleSizes: [2, 5],
  },
  {
    name: 'Vue West End',
    bundleSizes: [3, 7],
  },
];

async function seed(): Promise<void> {
  console.info('🌱 Starting Doomsday Ready database seed...');
  console.info('Connecting to MongoDB...');

  try {
    await mongoose.connect(MONGODB_URI);
    console.info(`Connected to MongoDB: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('Failed to connect to MongoDB for seeding:');
    console.error(err);
    console.error('\nEnsure MONGODB_URI is configured correctly in apps/api/.env');
    console.error(
      'If using MongoDB Atlas, verify your current IP is whitelisted in Network Access.',
    );
    process.exit(1);
  }

  try {
    // 1. Seed Movies (Create if absent; preserve existing user data on rerun)
    console.info('Checking movies...');
    const movieDocMap = new Map<string, mongoose.Types.ObjectId>();
    const newlyCreatedTitles = new Set<string>();

    for (const m of MCU_MOVIES) {
      const normalizedTitle = m.title.trim().toLowerCase();
      let doc = await Movie.findOne({ normalizedTitle });
      if (!doc) {
        doc = await Movie.create({
          title: m.title.trim(),
          normalizedTitle,
          releaseYear: m.releaseYear,
          runtime: m.runtime,
          watched: m.watched,
          prerequisites: [],
        });
        newlyCreatedTitles.add(m.title);
        console.info(`  Created movie: "${m.title}"`);
      } else {
        console.info(`  Found existing movie: "${doc.title}" (preserving user data)`);
      }
      movieDocMap.set(m.title, doc._id as mongoose.Types.ObjectId);
    }

    // 2. Link Prerequisites (for newly created movies or those with empty prerequisites)
    console.info('Checking movie prerequisites...');
    for (const m of MCU_MOVIES) {
      const docId = movieDocMap.get(m.title);
      if (!docId) continue;

      const currentDoc = await Movie.findById(docId);
      // Only link prerequisites if movie was newly inserted or currently has no prerequisites set
      if (
        !currentDoc ||
        (!newlyCreatedTitles.has(m.title) && currentDoc.prerequisites.length > 0)
      ) {
        continue;
      }

      const prereqIds: mongoose.Types.ObjectId[] = [];
      for (const pTitle of m.prereqTitles) {
        const pId = movieDocMap.get(pTitle);
        if (pId) {
          prereqIds.push(pId);
        }
      }

      if (prereqIds.length > 0) {
        await Movie.findByIdAndUpdate(docId, {
          $set: { prerequisites: prereqIds },
        });
        console.info(`  Linked ${m.title} -> [${m.prereqTitles.join(', ')}]`);
      }
    }

    // 3. Seed Sample Cinemas (Create if absent; preserve existing on rerun)
    console.info('Checking sample cinemas...');
    for (const c of SAMPLE_CINEMAS) {
      const normalizedName = c.name.trim().toLowerCase();
      const existing = await Cinema.findOne({ normalizedName });
      if (!existing) {
        await Cinema.create({
          name: c.name.trim(),
          normalizedName,
          bundleSizes: [...c.bundleSizes].sort((a, b) => a - b),
        });
        console.info(`  Created cinema: "${c.name}" with bundles [${c.bundleSizes.join(', ')}]`);
      } else {
        console.info(`  Found existing cinema: "${existing.name}" (preserving bundle sizes)`);
      }
    }

    console.info('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.info('MongoDB connection closed.');
  }
}

seed();
