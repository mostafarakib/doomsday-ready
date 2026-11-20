import { Types } from 'mongoose';
import { Movie, IMovie } from './movie.model.js';
import { CreateMovieInput, UpdateMovieInput } from './movie.validation.js';
import { normalizeTitle } from '../../utils/objectId.js';
import { AppError } from '../../middleware/errorHandler.js';
import { hasCycle, getPrerequisiteOrder } from './movie.graph.js';

export interface RewatchOrderResult {
  targetMovie: IMovie;
  prerequisites: IMovie[];
  totalPrerequisites: number;
  watchedPrerequisites: number;
  unwatchedRuntime: number;
}

/**
 * Builds an in-memory adjacency list from all existing movies in the database.
 */
async function buildCurrentGraph(): Promise<Map<string, string[]>> {
  const allMovies = await Movie.find({}, { _id: 1, prerequisites: 1 });
  const graph = new Map<string, string[]>();
  for (const m of allMovies) {
    graph.set(
      m._id.toString(),
      (m.prerequisites || []).map((p) => p.toString()),
    );
  }
  return graph;
}

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

  // Validate prerequisites if provided
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

    // Evaluate proposed graph with DFS cycle detection defensively
    const tempId = new Types.ObjectId().toString();
    const graph = await buildCurrentGraph();
    graph.set(tempId, input.prerequisites);

    if (hasCycle(graph)) {
      throw new AppError(
        409,
        'CIRCULAR_DEPENDENCY',
        'A circular dependency was detected in the proposed prerequisite relationships.',
      );
    }
  }

  const movie = await Movie.create({
    title: input.title,
    normalizedTitle,
    releaseYear: input.releaseYear,
    runtime: input.runtime,
    prerequisites: (input.prerequisites || []) as unknown as Types.ObjectId[],
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

  // Prerequisite validation & cycle detection
  if (input.prerequisites !== undefined) {
    // Check direct self-reference
    if (input.prerequisites.includes(id)) {
      throw new AppError(
        409,
        'CIRCULAR_DEPENDENCY',
        'A circular dependency was detected in the proposed prerequisite relationships.',
      );
    }

    // Check duplicate prerequisites in request body
    const uniquePrereqs = new Set(input.prerequisites);
    if (uniquePrereqs.size !== input.prerequisites.length) {
      throw new AppError(
        400,
        'DUPLICATE_PREREQUISITES',
        'Duplicate prerequisite IDs are not allowed.',
      );
    }

    // Verify all referenced prerequisites exist
    if (input.prerequisites.length > 0) {
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

    // Apply proposed change to the in-memory graph and run DFS cycle detection
    const graph = await buildCurrentGraph();
    graph.set(id, input.prerequisites);

    if (hasCycle(graph)) {
      throw new AppError(
        409,
        'CIRCULAR_DEPENDENCY',
        'A circular dependency was detected in the proposed prerequisite relationships.',
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
  if (input.prerequisites !== undefined) {
    movie.prerequisites = input.prerequisites as unknown as Types.ObjectId[];
  }

  await movie.save();
  return movie;
}

/**
 * Computes the ordered rewatch plan for a target movie.
 *
 * Traverses transitive prerequisites using DFS with visited set deduplication.
 * Prerequisite movies appear in prerequisite-first topological order.
 * The target movie is excluded from the prerequisite list.
 */
export async function getRewatchOrder(id: string): Promise<RewatchOrderResult> {
  const targetMovie = await Movie.findById(id);
  if (!targetMovie) {
    throw new AppError(404, 'NOT_FOUND', `Movie with ID ${id} not found.`);
  }

  const graph = await buildCurrentGraph();
  const orderedIds = getPrerequisiteOrder(id, graph);

  if (orderedIds.length === 0) {
    return {
      targetMovie,
      prerequisites: [],
      totalPrerequisites: 0,
      watchedPrerequisites: 0,
      unwatchedRuntime: 0,
    };
  }

  // Fetch full documents for the ordered prerequisites
  const prereqDocs = await Movie.find({ _id: { $in: orderedIds } });
  const docMap = new Map(prereqDocs.map((doc) => [doc._id.toString(), doc]));

  // Re-map to preserve exact prerequisite-first topological order
  const orderedPrerequisites = orderedIds.map((prereqId) => docMap.get(prereqId)!);

  const totalPrerequisites = orderedPrerequisites.length;
  const watchedPrerequisites = orderedPrerequisites.filter((m) => m.watched).length;
  const unwatchedRuntime = orderedPrerequisites
    .filter((m) => !m.watched)
    .reduce((sum, m) => sum + m.runtime, 0);

  return {
    targetMovie,
    prerequisites: orderedPrerequisites,
    totalPrerequisites,
    watchedPrerequisites,
    unwatchedRuntime,
  };
}
