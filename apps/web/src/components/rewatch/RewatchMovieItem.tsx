import { useState } from 'react';
import { Movie } from '../../types/movie.ts';

export interface RewatchMovieItemProps {
  movie: Movie;
  stepNumber: number;
  isLast: boolean;
  onToggleWatched: (movie: Movie) => Promise<void>;
}

export function RewatchMovieItem({
  movie,
  stepNumber,
  isLast,
  onToggleWatched,
}: RewatchMovieItemProps) {
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
    <div className="relative flex items-start gap-4">
      {/* Sequence step node and connecting timeline line */}
      <div className="flex flex-col items-center self-stretch shrink-0">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full border text-xs font-bold transition-all ${
            movie.watched
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600 shadow-sm shadow-emerald-950'
              : 'bg-[#1e1e1e] text-[#a3a3a3] border-[#3a3a3a]'
          }`}
        >
          {movie.watched ? '✓' : stepNumber}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-[#262626] my-1" />}
      </div>

      {/* Movie Details card */}
      <div
        className={`flex-1 rounded-xl border p-4 mb-3 transition-all ${
          movie.watched
            ? 'border-emerald-900/40 bg-[#121614] opacity-85'
            : 'border-[#2a2a2a] bg-[#161616] hover:border-[#383838]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#222222] text-[#888888]">
                Step #{stepNumber}
              </span>
              <h4
                className={`text-base font-bold ${
                  movie.watched
                    ? 'text-emerald-100 line-through decoration-emerald-600/60'
                    : 'text-white'
                }`}
              >
                {movie.title}
              </h4>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#888888] mt-1.5">
              <span>📅 {movie.releaseYear}</span>
              <span>•</span>
              <span>
                ⏱️ {runtimeFormatted} ({movie.runtime} min)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto ${
              movie.watched
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/70 hover:bg-emerald-900/60'
                : 'bg-[#222222] text-[#888888] border-[#383838] hover:text-white hover:border-[#4f4f4f]'
            }`}
            title="Click to toggle watched status"
          >
            {isToggling ? (
              <svg
                className="animate-spin h-3.5 w-3.5 text-current"
                fill="none"
                viewBox="0 0 24 24"
              >
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
              <span>✓ Watched</span>
            ) : (
              <span>○ Mark Watched</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
