import { Types } from 'mongoose';
import { Movie, IMovie } from './movie.model.js';
import { CreateMovieInput, UpdateMovieInput } from './movie.validation.js';
import { normalizeTitle } from '../../utils/objectId.js';
import { AppError } from '../../middleware/errorHandler.js';

export async function createMovie(input: CreateMovieInput): Promise<IMovie> {
  const normalizedTitle = normalizeTitle(input.title);

  // Check duplicate title
  const existing = await Movie.findOne({ normalizedTitle });
  if (existing) {
    throw new AppError(
      409,
      'DUPLICATE_TITLE',
      `A movie with title "${input.title}" already exists.`,
    );
  }

  // Check duplicate prerequisites
  if (input.prerequisites && input.prerequisites.length > 0) {
    const uniquePrereqs = new Set(input.prerequisites);
    if (uniquePrereqs.size !== input.prerequisites.length) {
      throw new AppError(
        400,
        'DUPLICATE_PREREQUISITES',
        'Duplicate prerequisite IDs are not allowed.',
      );
    }

    // Verify all referenced prerequisites exist
    const count = await Movie.countDocuments({
      _id: { $in: input.prerequisites },
    });
    if (count !== input.prerequisites.length) {
      throw new AppError(
        400,
        'INVALID_PREREQUISITE',
        'One or more referenced prerequisite movies do not exist.',
      );
    }
  }

  const movie = await Movie.create({
    title: input.title,
    normalizedTitle,
    releaseYear: input.releaseYear,
    runtime: input.runtime,
    prerequisites: input.prerequisites as unknown as Types.ObjectId[],
    watched: input.watched,
  });

  return movie;
}

export async function getMovies(): Promise<IMovie[]> {
  return Movie.find().sort({ releaseYear: 1, title: 1 });
}

export async function updateMovie(id: string, input: UpdateMovieInput): Promise<IMovie> {
  const movie = await Movie.findById(id);
  if (!movie) {
    throw new AppError(404, 'NOT_FOUND', `Movie with ID ${id} not found.`);
  }

  // Phase 2 scope guard: Temporarily prevent changing an existing movie's prerequisites
  // to avoid introducing indirect cycles until full DFS cycle detection is implemented in Phase 3.
  if (input.prerequisites !== undefined) {
    throw new AppError(
      400,
      'PREREQUISITE_UPDATE_DISABLED',
      'Prerequisite updates on existing movies are temporarily disabled in Phase 2. Prerequisite editing will be available in Phase 3.',
    );
  }

  // Pre-validate title uniqueness if title is being changed
  let normalizedTitle: string | undefined;
  if (input.title !== undefined) {
    normalizedTitle = normalizeTitle(input.title);
    const existing = await Movie.findOne({
      normalizedTitle,
      _id: { $ne: id },
    });
    if (existing) {
      throw new AppError(
        409,
        'DUPLICATE_TITLE',
        `A movie with title "${input.title}" already exists.`,
      );
    }
  }

  // All validations succeeded — apply updates without partial state modification on error
  if (input.title !== undefined) {
    movie.title = input.title;
    movie.normalizedTitle = normalizedTitle!;
  }
  if (input.releaseYear !== undefined) {
    movie.releaseYear = input.releaseYear;
  }
  if (input.runtime !== undefined) {
    movie.runtime = input.runtime;
  }
  if (input.watched !== undefined) {
    movie.watched = input.watched;
  }

  await movie.save();
  return movie;
}
