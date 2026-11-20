import { useEffect, useState, useMemo, useCallback } from 'react';
import { Movie } from '../types/movie.ts';
import { moviesApi } from '../api/movies.ts';
import { Layout } from '../components/Layout.tsx';
import { MovieCard } from '../components/movies/MovieCard.tsx';
import { MovieStats } from '../components/movies/MovieStats.tsx';
import { MovieFormModal } from '../components/movies/MovieFormModal.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Alert } from '../components/ui/Alert.tsx';

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'watched' | 'unwatched'>('all');
  const [sortBy, setSortBy] = useState<'year-asc' | 'year-desc' | 'title-asc' | 'runtime-desc'>(
    'year-asc',
  );

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movieToEdit, setMovieToEdit] = useState<Movie | null>(null);

  // Feedback Notification
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchMovies = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await moviesApi.getMovies();
      setMovies(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch movies from the backend.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // Fast ID to Movie lookup for prerequisites
  const movieMap = useMemo(() => {
    const map = new Map<string, Movie>();
    for (const m of movies) {
      map.set(m._id, m);
    }
    return map;
  }, [movies]);

  // Filtered & Sorted Movie list
  const visibleMovies = useMemo(() => {
    return movies
      .filter((m) => {
        // Search filter
        if (search.trim()) {
          const q = search.toLowerCase();
          if (!m.title.toLowerCase().includes(q)) return false;
        }

        // Status filter
        if (statusFilter === 'watched' && !m.watched) return false;
        if (statusFilter === 'unwatched' && m.watched) return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'year-asc':
            return a.releaseYear - b.releaseYear || a.title.localeCompare(b.title);
          case 'year-desc':
            return b.releaseYear - a.releaseYear || a.title.localeCompare(b.title);
          case 'title-asc':
            return a.title.localeCompare(b.title);
          case 'runtime-desc':
            return b.runtime - a.runtime;
          default:
            return 0;
        }
      });
  }, [movies, search, statusFilter, sortBy]);

  async function handleToggleWatched(movie: Movie) {
    try {
      const updated = await moviesApi.updateMovie(movie._id, {
        watched: !movie.watched,
      });

      // Update state locally
      setMovies((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      showNotification(
        'success',
        `Marked "${movie.title}" as ${updated.watched ? 'watched' : 'unwatched'}.`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update watched status.';
      showNotification('error', msg);
    }
  }

  function handleOpenCreate() {
    setMovieToEdit(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(movie: Movie) {
    setMovieToEdit(movie);
    setIsModalOpen(true);
  }

  function showNotification(type: 'success' | 'error', message: string) {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  }

  function handleModalSuccess() {
    const action = movieToEdit ? 'updated' : 'added';
    showNotification('success', `Movie successfully ${action}!`);
    fetchMovies();
  }

  return (
    <Layout>
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md shadow-2xl animate-fade-in">
          <Alert
            variant={notification.type === 'success' ? 'success' : 'error'}
            onDismiss={() => setNotification(null)}
          >
            {notification.message}
          </Alert>
        </div>
      )}

      {/* Header & Main Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span>🎬</span> MCU Movies
          </h1>
          <p className="text-sm text-[#888888] mt-1 max-w-xl">
            Track and configure Marvel Cinematic Universe films, set chronological prerequisites,
            and monitor your watch progress.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleOpenCreate}>
          <span className="text-lg leading-none">+</span> Add Movie
        </Button>
      </div>

      {/* Stats Summary Bar */}
      <MovieStats movies={movies} />

      {/* Filters and Controls */}
      <div className="rounded-xl border border-[#262626] bg-[#141414] p-4 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search movies by title..."
            className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] pl-9 pr-4 py-2 text-sm text-white placeholder-[#666666] focus:border-[#dc2626] focus:outline-none"
          />
          <span className="absolute left-3 top-2.5 text-xs text-[#666666]">🔍</span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'unwatched', 'watched'] as const).map((filter) => {
            const isActive = statusFilter === filter;
            const count =
              filter === 'all'
                ? movies.length
                : filter === 'watched'
                  ? movies.filter((m) => m.watched).length
                  : movies.filter((m) => !m.watched).length;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#2a2a2a] text-white border border-[#3f3f3f]'
                    : 'text-[#888888] hover:text-[#f5f5f5] hover:bg-[#1c1c1c]'
                }`}
              >
                {filter} ({count})
              </button>
            );
          })}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs uppercase font-semibold text-[#666666]">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1.5 text-xs text-[#f5f5f5] focus:border-[#dc2626] focus:outline-none cursor-pointer"
          >
            <option value="year-asc">Year (Earliest first)</option>
            <option value="year-desc">Year (Latest first)</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="runtime-desc">Runtime (Longest first)</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="rounded-xl border border-[#222222] bg-[#161616] p-5 h-48 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-5 bg-[#262626] rounded w-3/4" />
                <div className="h-3 bg-[#262626] rounded w-1/3" />
                <div className="h-4 bg-[#262626] rounded w-1/2" />
              </div>
              <div className="h-6 bg-[#262626] rounded w-1/4 self-end" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-8 text-center space-y-4 max-w-lg mx-auto">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-lg font-bold text-red-200">Unable to load movies</h2>
          <p className="text-sm text-red-300/80 leading-relaxed">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchMovies}>
            Retry Connection
          </Button>
        </div>
      ) : movies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#2a2a2a] bg-[#121212] p-12 text-center max-w-md mx-auto space-y-4">
          <span className="text-5xl">🎬</span>
          <h2 className="text-xl font-bold text-white">No Movies in Catalog</h2>
          <p className="text-sm text-[#888888] leading-relaxed">
            Get started by adding your first MCU film. You can specify release years, runtimes, and
            prerequisites.
          </p>
          <Button variant="primary" size="md" onClick={handleOpenCreate}>
            + Add First Movie
          </Button>
        </div>
      ) : visibleMovies.length === 0 ? (
        <div className="rounded-xl border border-[#222222] bg-[#141414] p-10 text-center max-w-md mx-auto space-y-3">
          <span className="text-3xl">🔍</span>
          <h3 className="text-base font-semibold text-white">No Matching Movies</h3>
          <p className="text-xs text-[#888888]">
            No movies match the search query &quot;{search}&quot; with the current filters.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleMovies.map((movie) => (
            <MovieCard
              key={movie._id}
              movie={movie}
              movieMap={movieMap}
              onEdit={handleOpenEdit}
              onToggleWatched={handleToggleWatched}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Movie Modal */}
      <MovieFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        movieToEdit={movieToEdit}
        allMovies={movies}
        onSuccess={handleModalSuccess}
      />
    </Layout>
  );
}
