import React, { useState, useEffect } from 'react';
import { Movie, CreateMovieInput, UpdateMovieInput } from '../../types/movie.ts';
import { moviesApi } from '../../api/movies.ts';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Alert } from '../ui/Alert.tsx';
import { Badge } from '../ui/Badge.tsx';

export interface MovieFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieToEdit: Movie | null;
  allMovies: Movie[];
  onSuccess: () => void;
}

export function MovieFormModal({
  isOpen,
  onClose,
  movieToEdit,
  allMovies,
  onSuccess,
}: MovieFormModalProps) {
  const isEditing = Boolean(movieToEdit);

  const [title, setTitle] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [runtime, setRuntime] = useState('');
  const [watched, setWatched] = useState(false);
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [searchPrereq, setSearchPrereq] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when opening or when movieToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (movieToEdit) {
        setTitle(movieToEdit.title);
        setReleaseYear(movieToEdit.releaseYear.toString());
        setRuntime(movieToEdit.runtime.toString());
        setWatched(movieToEdit.watched);
        setPrerequisites([...movieToEdit.prerequisites]);
      } else {
        setTitle('');
        setReleaseYear(new Date().getFullYear().toString());
        setRuntime('120');
        setWatched(false);
        setPrerequisites([]);
      }
      setSearchPrereq('');
      setError(null);
    }
  }, [isOpen, movieToEdit]);

  // Candidates for prerequisites: exclude self if editing
  const availablePrereqs = allMovies.filter((m) => {
    if (isEditing && movieToEdit && m._id === movieToEdit._id) {
      return false;
    }
    return true;
  });

  const filteredPrereqs = availablePrereqs.filter((m) =>
    m.title.toLowerCase().includes(searchPrereq.toLowerCase()),
  );

  function handleTogglePrereq(id: string) {
    if (prerequisites.includes(id)) {
      setPrerequisites(prerequisites.filter((p) => p !== id));
    } else {
      setPrerequisites([...prerequisites, id]);
    }
  }

  function handleRemovePrereq(id: string) {
    setPrerequisites(prerequisites.filter((p) => p !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title cannot be empty.');
      return;
    }

    const parsedYear = parseInt(releaseYear, 10);
    if (isNaN(parsedYear) || parsedYear <= 0) {
      setError('Release year must be a positive integer.');
      return;
    }

    const parsedRuntime = parseInt(runtime, 10);
    if (isNaN(parsedRuntime) || parsedRuntime < 1 || parsedRuntime > 300) {
      setError('Runtime must be an integer between 1 and 300 minutes.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (isEditing && movieToEdit) {
        const payload: UpdateMovieInput = {
          title: trimmedTitle,
          releaseYear: parsedYear,
          runtime: parsedRuntime,
          watched,
          prerequisites,
        };
        await moviesApi.updateMovie(movieToEdit._id, payload);
      } else {
        const payload: CreateMovieInput = {
          title: trimmedTitle,
          releaseYear: parsedYear,
          runtime: parsedRuntime,
          watched,
          prerequisites,
        };
        await moviesApi.createMovie(payload);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while saving the movie.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Movie: ${movieToEdit?.title}` : 'Add New MCU Movie'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <Alert variant="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Title */}
        <div>
          <label
            htmlFor="movie-title"
            className="block text-xs uppercase font-semibold text-[#a3a3a3] mb-1.5"
          >
            Movie Title <span className="text-[#dc2626]">*</span>
          </label>
          <input
            id="movie-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Captain America: The First Avenger"
            className="w-full rounded-lg border border-[#2a2a2a] bg-[#111111] px-3.5 py-2 text-sm text-white placeholder-[#555555] focus:border-[#dc2626] focus:outline-none focus:ring-1 focus:ring-[#dc2626] transition-colors"
          />
        </div>

        {/* Year and Runtime */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="movie-year"
              className="block text-xs uppercase font-semibold text-[#a3a3a3] mb-1.5"
            >
              Release Year <span className="text-[#dc2626]">*</span>
            </label>
            <input
              id="movie-year"
              type="number"
              required
              min={1900}
              max={2100}
              value={releaseYear}
              onChange={(e) => setReleaseYear(e.target.value)}
              placeholder="e.g. 2011"
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#111111] px-3.5 py-2 text-sm text-white placeholder-[#555555] focus:border-[#dc2626] focus:outline-none focus:ring-1 focus:ring-[#dc2626] transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="movie-runtime"
              className="block text-xs uppercase font-semibold text-[#a3a3a3] mb-1.5"
            >
              Runtime (min, 1–300) <span className="text-[#dc2626]">*</span>
            </label>
            <input
              id="movie-runtime"
              type="number"
              required
              min={1}
              max={300}
              value={runtime}
              onChange={(e) => setRuntime(e.target.value)}
              placeholder="e.g. 124"
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#111111] px-3.5 py-2 text-sm text-white placeholder-[#555555] focus:border-[#dc2626] focus:outline-none focus:ring-1 focus:ring-[#dc2626] transition-colors"
            />
          </div>
        </div>

        {/* Watched Status */}
        <div className="flex items-center gap-3 p-3 rounded-lg border border-[#262626] bg-[#121212]">
          <input
            id="movie-watched"
            type="checkbox"
            checked={watched}
            onChange={(e) => setWatched(e.target.checked)}
            className="w-4 h-4 rounded text-[#dc2626] border-[#333333] bg-[#222222] focus:ring-[#dc2626] cursor-pointer"
          />
          <label
            htmlFor="movie-watched"
            className="text-sm font-medium text-[#f5f5f5] cursor-pointer select-none"
          >
            I have already watched this movie
          </label>
        </div>

        {/* Prerequisites selection */}
        <div>
          <label className="block text-xs uppercase font-semibold text-[#a3a3a3] mb-1.5">
            Prerequisites (Must watch first)
          </label>

          {/* Selected prerequisites chips */}
          {prerequisites.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 p-2.5 rounded-lg border border-[#262626] bg-[#141414]">
              {prerequisites.map((id) => {
                const target = allMovies.find((m) => m._id === id);
                return (
                  <Badge key={id} variant="brand" onRemove={() => handleRemovePrereq(id)}>
                    {target ? target.title : id}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Search prerequisites */}
          <div className="relative mb-2">
            <input
              type="text"
              value={searchPrereq}
              onChange={(e) => setSearchPrereq(e.target.value)}
              placeholder="Filter available movies..."
              className="w-full rounded-lg border border-[#262626] bg-[#111111] pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#555555] focus:border-[#dc2626] focus:outline-none"
            />
            <span className="absolute left-2.5 top-2 text-xs text-[#555555]">🔍</span>
          </div>

          {/* Scrollable checklist of candidates */}
          <div className="max-h-48 overflow-y-auto rounded-lg border border-[#262626] bg-[#111111] p-1 divide-y divide-[#1e1e1e]">
            {availablePrereqs.length === 0 ? (
              <p className="p-3 text-xs text-center text-[#555555]">
                No other movies available in the catalog yet.
              </p>
            ) : filteredPrereqs.length === 0 ? (
              <p className="p-3 text-xs text-center text-[#555555]">
                No movies match &quot;{searchPrereq}&quot;.
              </p>
            ) : (
              filteredPrereqs.map((m) => {
                const isSelected = prerequisites.includes(m._id);
                return (
                  <div
                    key={m._id}
                    onClick={() => handleTogglePrereq(m._id)}
                    className={`flex items-center justify-between px-3 py-2 text-xs rounded transition-colors cursor-pointer select-none ${
                      isSelected
                        ? 'bg-red-950/30 text-white font-medium'
                        : 'text-[#a3a3a3] hover:bg-[#1a1a1a] hover:text-[#f5f5f5]'
                    }`}
                  >
                    <span className="truncate pr-2">
                      {m.title} <span className="text-[#666666]">({m.releaseYear})</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent div
                      className="w-3.5 h-3.5 rounded text-[#dc2626] border-[#333333] bg-[#222222] focus:ring-0 cursor-pointer pointer-events-none"
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#262626]">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Add Movie'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
