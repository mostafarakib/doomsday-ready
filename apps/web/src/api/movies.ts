import { apiRequest } from './client.ts';
import { Movie, CreateMovieInput, UpdateMovieInput } from '../types/movie.ts';

export const moviesApi = {
  getMovies: (): Promise<Movie[]> => {
    return apiRequest<Movie[]>('/api/movies');
  },

  createMovie: (data: CreateMovieInput): Promise<Movie> => {
    return apiRequest<Movie>('/api/movies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateMovie: (id: string, data: UpdateMovieInput): Promise<Movie> => {
    return apiRequest<Movie>(`/api/movies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
