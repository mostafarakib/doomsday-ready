import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Movie, RewatchPlan } from '../types/movie.ts';
import { moviesApi } from '../api/movies.ts';
import { Layout } from '../components/Layout.tsx';
import { RewatchMovieItem } from '../components/rewatch/RewatchMovieItem.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Alert } from '../components/ui/Alert.tsx';

export default function RewatchPlanPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTarget = searchParams.get('target') || '';

  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(urlTarget);
  const [plan, setPlan] = useState<RewatchPlan | null>(null);

  const [isLoadingMovies, setIsLoadingMovies] = useState(true);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // 1. Fetch available movies for the selector
  useEffect(() => {
    async function loadMovies() {
      try {
        setIsLoadingMovies(true);
        const data = await moviesApi.getMovies();
        setMovies(data);

        // If target from URL exists in the catalog, select it; otherwise default to first if none selected
        if (urlTarget && data.some((m) => m._id === urlTarget)) {
          setSelectedTargetId(urlTarget);
        } else if (data.length > 0 && !urlTarget) {
          // Default to the last movie or Doomsday if present
          const doomsdayMovie = data.find((m) => m.title.toLowerCase().includes('doomsday'));
          const defaultMovie = doomsdayMovie || data[data.length - 1];
          setSelectedTargetId(defaultMovie._id);
          setSearchParams({ target: defaultMovie._id }, { replace: true });
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load movie catalog.');
      } finally {
        setIsLoadingMovies(false);
      }
    }
    loadMovies();
  }, [urlTarget, setSearchParams]);

  // 2. Fetch rewatch order for the selected target
  const loadPlan = useCallback(async (targetId: string) => {
    if (!targetId) {
      setPlan(null);
      return;
    }
    try {
      setIsLoadingPlan(true);
      setError(null);
      const data = await moviesApi.getRewatchOrder(targetId);
      setPlan(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to calculate rewatch order.');
      setPlan(null);
    } finally {
      setIsLoadingPlan(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTargetId) {
      loadPlan(selectedTargetId);
    }
  }, [selectedTargetId, loadPlan]);

  function handleSelectTarget(id: string) {
    setSelectedTargetId(id);
    if (id) {
      setSearchParams({ target: id });
    } else {
      setSearchParams({});
    }
  }

  async function handleToggleWatched(movie: Movie) {
    try {
      const updated = await moviesApi.updateMovie(movie._id, {
        watched: !movie.watched,
      });

      // Re-fetch the rewatch order so progress, counts, and runtime update directly from backend
      if (selectedTargetId) {
        await loadPlan(selectedTargetId);
      }

      showNotification(
        'success',
        `Marked "${movie.title}" as ${updated.watched ? 'watched' : 'unwatched'}.`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update watched status.';
      showNotification('error', msg);
    }
  }

  function showNotification(type: 'success' | 'error', message: string) {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  }

  // Calculate runtime formatting
  const unwatchedMins = plan?.unwatchedRuntime ?? 0;
  const hours = Math.floor(unwatchedMins / 60);
  const mins = unwatchedMins % 60;
  const remainingRuntimeFormatted =
    unwatchedMins === 0 ? '0m' : hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;

  const totalPrereqs = plan?.totalPrerequisites ?? 0;
  const watchedPrereqs = plan?.watchedPrerequisites ?? 0;
  const progressPercent =
    totalPrereqs === 0 ? 100 : Math.round((watchedPrereqs / totalPrereqs) * 100);

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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span>📋</span> MCU Rewatch Plan
          </h1>
          <p className="text-sm text-[#888888] mt-1 max-w-2xl leading-relaxed">
            Select a destination film to compute its full transitive prerequisite chain in exact
            topological watch order, powered by handwritten cycle-free graph algorithms.
          </p>
        </div>

        <Link to="/movies">
          <Button variant="secondary" size="md">
            ← Back to Movies
          </Button>
        </Link>
      </div>

      {/* Movie Target Selector Card */}
      <div className="rounded-xl border border-[#262626] bg-[#141414] p-5 mb-8">
        <label
          htmlFor="target-movie-select"
          className="block text-xs uppercase font-semibold text-[#888888] tracking-wider mb-2"
        >
          Target Destination Movie
        </label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            id="target-movie-select"
            value={selectedTargetId}
            onChange={(e) => handleSelectTarget(e.target.value)}
            disabled={isLoadingMovies || movies.length === 0}
            className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#1c1c1c] px-4 py-2.5 text-sm text-white focus:border-[#dc2626] focus:outline-none cursor-pointer disabled:opacity-50"
          >
            {movies.length === 0 && <option value="">No movies available in catalog</option>}
            {movies.map((m) => (
              <option key={m._id} value={m._id}>
                {m.title} ({m.releaseYear}) — {m.runtime} min
              </option>
            ))}
          </select>

          {plan?.targetMovie && (
            <button
              type="button"
              onClick={() => handleToggleWatched(plan.targetMovie)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                plan.targetMovie.watched
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                  : 'bg-[#222222] text-[#888888] border-[#333333] hover:text-white hover:border-[#444444]'
              }`}
              title="Toggle watched status for the target movie itself"
            >
              <span>{plan.targetMovie.watched ? '✓' : '○'}</span>
              <span>Target: {plan.targetMovie.watched ? 'Watched' : 'Unwatched'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <Alert variant="error" className="mb-6" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading Skeletons */}
      {isLoadingPlan ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#262626] bg-[#161616] p-6 h-36 animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-[#222222] bg-[#161616] p-4 h-20 animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : !plan ? (
        <div className="rounded-2xl border border-dashed border-[#2a2a2a] bg-[#121212] p-12 text-center max-w-md mx-auto space-y-4">
          <span className="text-4xl">🎬</span>
          <h3 className="text-lg font-bold text-white">Select a Target Movie</h3>
          <p className="text-xs text-[#888888]">
            Choose an MCU film above to see its complete prerequisite watch timeline.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Target Film Summary Hero */}
          <div className="rounded-xl border border-red-950/80 bg-gradient-to-r from-red-950/30 via-[#161616] to-[#161616] p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-4 min-w-0">
                {/* Target Movie Poster with 2:3 aspect ratio */}
                <div className="w-16 sm:w-20 shrink-0 aspect-[2/3] rounded-lg overflow-hidden bg-[#202020] border border-red-900/40 relative shadow-md">
                  {plan.targetMovie.posterUrl ? (
                    <img
                      src={plan.targetMovie.posterUrl}
                      alt={`${plan.targetMovie.title} poster`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a] text-[#555555]">
                      <span className="text-2xl select-none">🎬</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] uppercase tracking-wider font-bold bg-[#dc2626] text-white px-2 py-0.5 rounded">
                      Target Destination
                    </span>
                    <span className="text-xs text-[#888888]">
                      Excluded from prerequisite list below
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white">{plan.targetMovie.title}</h2>
                  <div className="flex items-center gap-3 text-xs text-[#888888] mt-1.5 flex-wrap">
                    <span>📅 Released: {plan.targetMovie.releaseYear}</span>
                    <span>•</span>
                    <span>⏱️ Runtime: {plan.targetMovie.runtime} min</span>
                    <span>•</span>
                    <span
                      className={
                        plan.targetMovie.watched ? 'text-emerald-400 font-medium' : 'text-[#888888]'
                      }
                    >
                      Status: {plan.targetMovie.watched ? 'Watched' : 'Unwatched'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress and Remaining Runtime Stats */}
              <div className="flex items-center gap-4 bg-[#111111] border border-[#2a2a2a] p-3.5 rounded-lg shrink-0">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-[#888888] tracking-wider block">
                    Remaining Unwatched Runtime
                  </span>
                  <span className="text-lg font-black text-white">{remainingRuntimeFormatted}</span>
                </div>
                <div className="w-px h-8 bg-[#2a2a2a]" />
                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-emerald-400 tracking-wider block">
                    Prerequisites Progress
                  </span>
                  <span className="text-lg font-black text-emerald-400">
                    {watchedPrereqs} / {totalPrereqs} ({progressPercent}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {totalPrereqs > 0 && (
              <div className="w-full bg-[#262626] rounded-full h-2 mt-5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>

          {/* Prerequisites Ordered Timeline */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>⏱️</span> Prerequisite Watch Order ({totalPrereqs})
              </h3>
              <span className="text-xs text-[#737373]">
                Order verified by server topological sort (Prerequisites first)
              </span>
            </div>

            {totalPrereqs === 0 ? (
              <div className="rounded-xl border border-[#262626] bg-[#141414] p-8 text-center space-y-3 max-w-lg mx-auto">
                <span className="text-4xl">🌟</span>
                <h4 className="text-base font-bold text-white">Direct Entry Point</h4>
                <p className="text-xs text-[#888888] leading-relaxed">
                  <strong className="text-[#f5f5f5]">{plan.targetMovie.title}</strong> has no
                  prerequisite movies in the catalog. You can watch this movie directly without any
                  prior watch requirements!
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {plan.prerequisites.map((prereq, index) => (
                  <RewatchMovieItem
                    key={prereq._id}
                    movie={prereq}
                    stepNumber={index + 1}
                    isLast={index === plan.prerequisites.length - 1}
                    onToggleWatched={handleToggleWatched}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Completion Celebration Banner when all watched */}
          {totalPrereqs > 0 && watchedPrereqs === totalPrereqs && (
            <div className="rounded-xl border border-emerald-800/80 bg-emerald-950/30 p-5 text-center space-y-1">
              <span className="text-2xl">🎉</span>
              <h4 className="text-base font-bold text-emerald-200">All prerequisites completed!</h4>
              <p className="text-xs text-emerald-300/80">
                You are ready to watch{' '}
                <strong className="text-white">{plan.targetMovie.title}</strong>.
              </p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
