export interface Movie {
  _id: string;
  title: string;
  normalizedTitle: string;
  releaseYear: number;
  runtime: number;
  prerequisites: string[];
  watched: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMovieInput {
  title: string;
  releaseYear: number;
  runtime: number;
  prerequisites?: string[];
  watched?: boolean;
}

export interface UpdateMovieInput {
  title?: string;
  releaseYear?: number;
  runtime?: number;
  prerequisites?: string[];
  watched?: boolean;
}

export interface RewatchPlan {
  targetMovie: Movie;
  prerequisites: Movie[];
  totalPrerequisites: number;
  watchedPrerequisites: number;
  unwatchedRuntime: number;
}
