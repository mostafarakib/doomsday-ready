import { Movie } from '../../types/movie.ts';

export interface MovieStatsProps {
  movies: Movie[];
}

export function MovieStats({ movies }: MovieStatsProps) {
  const total = movies.length;
  const watched = movies.filter((m) => m.watched).length;
  const unwatched = total - watched;
  const unwatchedRuntime = movies.filter((m) => !m.watched).reduce((sum, m) => sum + m.runtime, 0);

  const hours = Math.floor(unwatchedRuntime / 60);
  const minutes = unwatchedRuntime % 60;
  const runtimeDisplay =
    unwatchedRuntime === 0
      ? '0m'
      : hours > 0
        ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
        : `${minutes}m`;

  const progressPercent = total === 0 ? 0 : Math.round((watched / total) * 100);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-4 flex flex-col justify-between">
        <span className="text-xs uppercase font-semibold text-[#888888] tracking-wider">
          Total Movies
        </span>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-3xl font-black text-white">{total}</span>
          <span className="text-xs text-[#888888]">in catalog</span>
        </div>
      </div>

      <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-semibold text-emerald-400 tracking-wider">
            Watched
          </span>
          <span className="text-xs font-bold text-emerald-400">{progressPercent}%</span>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-3xl font-black text-emerald-400">{watched}</span>
          <span className="text-xs text-[#888888]">of {total}</span>
        </div>
        <div className="w-full bg-[#262626] rounded-full h-1.5 mt-3 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-4 flex flex-col justify-between">
        <span className="text-xs uppercase font-semibold text-amber-400 tracking-wider">
          Remaining Unwatched
        </span>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-3xl font-black text-amber-400">{unwatched}</span>
          <span className="text-xs text-[#888888]">movies</span>
        </div>
      </div>

      <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-4 flex flex-col justify-between">
        <span className="text-xs uppercase font-semibold text-[#dc2626] tracking-wider">
          Unwatched Runtime
        </span>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-3xl font-black text-[#f5f5f5]">{runtimeDisplay}</span>
          <span className="text-xs text-[#888888]">({unwatchedRuntime} min)</span>
        </div>
      </div>
    </div>
  );
}
