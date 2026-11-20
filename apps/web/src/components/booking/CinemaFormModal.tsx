import React, { useState } from 'react';
import { bookingApi } from '../../api/bookings.ts';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Alert } from '../ui/Alert.tsx';

export interface CinemaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CinemaFormModal({ isOpen, onClose, onSuccess }: CinemaFormModalProps) {
  const [name, setName] = useState('');
  const [bundleSizesStr, setBundleSizesStr] = useState('1, 3, 5');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Cinema name cannot be empty.');
      return;
    }

    // Parse comma-separated bundle sizes
    const rawSizes = bundleSizesStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (rawSizes.length === 0) {
      setError('At least one bundle size is required.');
      return;
    }

    const parsedSizes: number[] = [];
    for (const s of rawSizes) {
      const num = Number(s);
      if (!Number.isInteger(num) || num < 1 || num > 500) {
        setError(`Bundle size "${s}" must be an integer between 1 and 500.`);
        return;
      }
      parsedSizes.push(num);
    }

    const uniqueSizes = Array.from(new Set(parsedSizes));
    if (uniqueSizes.length !== parsedSizes.length) {
      setError('Bundle sizes must be unique (no duplicates).');
      return;
    }

    if (uniqueSizes.length > 10) {
      setError('A maximum of 10 bundle sizes is allowed.');
      return;
    }

    try {
      setIsSubmitting(true);
      await bookingApi.createCinema({
        name: trimmedName,
        bundleSizes: uniqueSizes,
      });

      setName('');
      setBundleSizesStr('1, 3, 5');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create cinema.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Cinema">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div>
          <label
            htmlFor="cinema-name"
            className="block text-xs uppercase font-semibold text-[#888888] mb-1.5"
          >
            Cinema Name <span className="text-[#dc2626]">*</span>
          </label>
          <input
            id="cinema-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Odeon Luxe Leicester Square"
            className="w-full rounded-lg border border-[#2a2a2a] bg-[#111111] px-3.5 py-2 text-sm text-white placeholder-[#555555] focus:border-[#dc2626] focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="bundle-sizes"
            className="block text-xs uppercase font-semibold text-[#888888] mb-1.5"
          >
            Seat Bundle Sizes (Comma-separated, 1–10 values, 1–500 each){' '}
            <span className="text-[#dc2626]">*</span>
          </label>
          <input
            id="bundle-sizes"
            type="text"
            required
            value={bundleSizesStr}
            onChange={(e) => setBundleSizesStr(e.target.value)}
            placeholder="e.g. 1, 3, 4"
            className="w-full rounded-lg border border-[#2a2a2a] bg-[#111111] px-3.5 py-2 text-sm text-white placeholder-[#555555] focus:border-[#dc2626] focus:outline-none"
          />
          <p className="text-[11px] text-[#666666] mt-1">
            Example: <code>1, 3, 4</code> allows single seats, 3-seat rows, and 4-seat booths.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262626]">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Add Cinema
          </Button>
        </div>
      </form>
    </Modal>
  );
}
