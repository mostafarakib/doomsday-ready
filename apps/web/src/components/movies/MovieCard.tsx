import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Movie } from '../../types/movie.ts';
import { Badge } from '../ui/Badge.tsx';

export interface MovieCardProps {
  movie: Movie;
  movieMap: Map<string, Movie>;
  onEdit: (movie: Movie) => void;
  onToggleWatched: (movie: Movie) => Promise<void>;
}

export function MovieCard({ movie, movieMap, onEdit, onToggleWatched }: MovieCardProps) {
  const [isToggling, setIsToggling] = useState(false);

  async function handleToggle() {
    try {
      setIsToggling(true);
      await onToggleWatched(movie);
    } finally {
      setIsToggling(false);
    }
  }

  const hours = Math.floor(movie.runtime / 60);
  const minutes = movie.runtime % 60;
  const runtimeFormatted =
    hours > 0 ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}` : `${minutes}m`;

  return (
    <div className="rounded-xl border border-[#262626] bg-[#161616] p-5 flex flex-col justify-between hover:border-[#383838] transition-all group shadow-sm hover:shadow-md">
      <div>
        {/* Top Header: Title and Watched Toggle */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-lg font-bold text-[#f5f5f5] group-hover:text-white leading-snug">
            {movie.title}
          </h3>
          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              movie.watched
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                : 'bg-[#222222] text-[#888888] border-[#333333] hover:text-[#f5f5f5] hover:border-[#444444]'
            }`}
            title="Click to toggle watched status"
          >
            {isToggling ? (
              <svg className="animate-spin h-3 w-3 text-current" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : movie.watched ? (
              <span>✓</span>
            ) : (
              <span>○</span>
            )}
            <span>{movie.watched ? 'Watched' : 'Unwatched'}</span>
          </button>
        </div>

        {/* Metadata: Release Year & Runtime */}
        <div className="flex items-center gap-3 text-xs text-[#888888] mb-4">
          <span className="flex items-center gap-1">
            <span>📅</span> {movie.releaseYear}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span>⏱️</span> {runtimeFormatted} ({movie.runtime} min)
          </span>
        </div>

        {/* Prerequisites */}
        <div className="mb-4">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#737373] block mb-1.5">
            Prerequisites ({movie.prerequisites.length})
          </span>
          {movie.prerequisites.length === 0 ? (
            <span className="text-xs italic text-[#555555]">None (Timeline entry point)</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {movie.prerequisites.map((prereqId) => {
                const target = movieMap.get(prereqId);
                const label = target ? target.title : prereqId;
                return (
                  <Badge key={prereqId} variant="default" size="sm">
                    {label}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="pt-3 border-t border-[#262626] flex items-center justify-between">
        <Link
          to={`/rewatch-plan?target=${movie._id}`}
          className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
        >
          <span>📋</span> Plan →
        </Link>

        <button
          type="button"
          onClick={() => onEdit(movie)}
          className="text-xs font-medium text-[#a3a3a3] hover:text-[#f5f5f5] hover:bg-[#222222] px-3 py-1.5 rounded-lg border border-transparent hover:border-[#333333] transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span>✏️</span> Edit Details
        </button>
      </div>
    </div>
  );
}
