import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Cinema, BookingQuote, BookingPlan } from '../types/booking.ts';
import { bookingApi } from '../api/bookings.ts';
import { bookingStorage } from '../lib/bookingStorage.ts';
import { Layout } from '../components/Layout.tsx';
import { BookingQuoteCard } from '../components/booking/BookingQuoteCard.tsx';
import { SavedBookingCard } from '../components/booking/SavedBookingCard.tsx';
import { CinemaFormModal } from '../components/booking/CinemaFormModal.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Alert } from '../components/ui/Alert.tsx';

export default function BookingPage() {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>('');
  const [groupSizeInput, setGroupSizeInput] = useState<string>('6');

  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [savedBookings, setSavedBookings] = useState<BookingPlan[]>([]);

  const [isLoadingCinemas, setIsLoadingCinemas] = useState(true);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  const [isCinemaModalOpen, setIsCinemaModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // 1. Fetch cinemas
  const fetchCinemas = useCallback(async () => {
    try {
      setIsLoadingCinemas(true);
      const data = await bookingApi.getCinemas();
      setCinemas(data);
      if (data.length > 0 && !selectedCinemaId) {
        setSelectedCinemaId(data[0]._id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cinemas.');
    } finally {
      setIsLoadingCinemas(false);
    }
  }, [selectedCinemaId]);

  // 2. Load saved bookings from browser localStorage
  const fetchSavedBookings = useCallback(() => {
    try {
      setIsLoadingBookings(true);
      const data = bookingStorage.getSavedBookings();
      setSavedBookings(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load saved booking plans.');
    } finally {
      setIsLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    fetchCinemas();
    fetchSavedBookings();
  }, [fetchCinemas, fetchSavedBookings]);

  // Selected cinema object
  const activeCinema = useMemo(() => {
    return cinemas.find((c) => c._id === selectedCinemaId) || null;
  }, [cinemas, selectedCinemaId]);

  // 3. Calculate booking quote
  const calculateQuote = useCallback(async (cinemaId: string, sizeStr: string) => {
    setError(null);
    const size = parseInt(sizeStr, 10);

    if (!cinemaId) {
      setError('Please select a cinema first.');
      return;
    }

    if (isNaN(size) || size < 1 || size > 10000) {
      setError('Group size must be an integer between 1 and 10,000.');
      return;
    }

    try {
      setIsLoadingQuote(true);
      const result = await bookingApi.getBookingQuote(cinemaId, size);
      setQuote(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to calculate quote.');
      setQuote(null);
    } finally {
      setIsLoadingQuote(false);
    }
  }, []);

  function handleCalculateSubmit(e: React.FormEvent) {
    e.preventDefault();
    calculateQuote(selectedCinemaId, groupSizeInput);
  }

  // 4. Save booking plan snapshot to browser localStorage
  async function handleSaveBooking(): Promise<void> {
    if (!quote || !quote.possible) return;

    try {
      setIsSaving(true);
      setError(null);

      // Persist snapshot immediately to localStorage
      bookingStorage.saveBookingPlan(quote, activeCinema?.bundleSizes || []);

      showNotification(
        'success',
        `Booking plan for ${quote.groupSize} seats at ${quote.cinemaName} saved successfully!`,
      );

      // Refresh saved plans list
      fetchSavedBookings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save booking plan.';
      showNotification('error', msg);
    } finally {
      setIsSaving(false);
    }
  }

  function showNotification(type: 'success' | 'error', message: string) {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span>🎟️</span> Opening Night Group Booking
          </h1>
          <p className="text-sm text-[#888888] mt-1 max-w-2xl leading-relaxed">
            Optimize your party&apos;s opening-night seat bundles for <em>Avengers: Doomsday</em>{' '}
            using bottom-up dynamic programming, and save planning snapshots.
          </p>
        </div>

        <Button variant="secondary" size="md" onClick={() => setIsCinemaModalOpen(true)}>
          <span className="text-lg leading-none">+</span> Add Cinema
        </Button>
      </div>

      {/* Global Error Banner */}
      {error && (
        <Alert variant="error" className="mb-6" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Grid: Calculator on Left, Saved Plans on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Quote Form & Result */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl border border-[#262626] bg-[#141414] p-6 space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#a3a3a3]">
              Seat Bundle Calculator
            </h2>

            <form onSubmit={handleCalculateSubmit} className="space-y-4">
              {/* Cinema Picker */}
              <div>
                <label
                  htmlFor="cinema-select"
                  className="block text-xs uppercase font-semibold text-[#888888] mb-1.5"
                >
                  Select Cinema
                </label>
                {isLoadingCinemas ? (
                  <div className="h-10 bg-[#1c1c1c] rounded-lg animate-pulse" />
                ) : cinemas.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#333333] p-3 text-center text-xs text-[#888888]">
                    No cinemas added yet.{' '}
                    <button
                      type="button"
                      onClick={() => setIsCinemaModalOpen(true)}
                      className="text-[#dc2626] hover:underline font-semibold"
                    >
                      Click here to add one
                    </button>
                    .
                  </div>
                ) : (
                  <select
                    id="cinema-select"
                    value={selectedCinemaId}
                    onChange={(e) => {
                      setSelectedCinemaId(e.target.value);
                      setQuote(null);
                    }}
                    className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white focus:border-[#dc2626] focus:outline-none cursor-pointer"
                  >
                    {cinemas.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} — Bundles: [{c.bundleSizes.join(', ')} seats]
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Group Size Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="group-size-input"
                    className="block text-xs uppercase font-semibold text-[#888888]"
                  >
                    Group Size (1 to 10,000)
                  </label>
                  <span className="text-[11px] text-[#666666]">Exact seat match required</span>
                </div>
                <input
                  id="group-size-input"
                  type="number"
                  required
                  min={1}
                  max={10000}
                  value={groupSizeInput}
                  onChange={(e) => {
                    setGroupSizeInput(e.target.value);
                    setQuote(null);
                  }}
                  placeholder="e.g. 6"
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3.5 py-2 text-sm text-white placeholder-[#555555] focus:border-[#dc2626] focus:outline-none"
                />

                {/* Quick Size Presets */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[11px] text-[#666666] mr-1">Presets:</span>
                  {[2, 4, 6, 8, 11, 20, 44].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setGroupSizeInput(size.toString());
                        setQuote(null);
                      }}
                      className={`text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer ${groupSizeInput === size.toString()
                        ? 'bg-[#2a2a2a] text-white border-[#444444]'
                        : 'bg-[#181818] text-[#888888] border-[#262626] hover:text-[#f5f5f5] hover:bg-[#202020]'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isLoadingQuote}
                disabled={cinemas.length === 0}
              >
                ⚡ Calculate Minimum Bundles
              </Button>
            </form>
          </div>

          {/* Quote Result Card */}
          <BookingQuoteCard
            quote={quote}
            isLoading={isLoadingQuote}
            onSave={handleSaveBooking}
            isSaving={isSaving}
            availableBundleSizes={activeCinema?.bundleSizes || []}
          />
        </div>

        {/* Right Column: Saved Booking Plans */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>📋</span> Saved Plans ({savedBookings.length})
              </h2>
              <span className="text-xs text-[#737373]">Newest calculations first</span>
            </div>
            <button
              type="button"
              onClick={fetchSavedBookings}
              className="text-xs text-[#888888] hover:text-white transition-colors"
            >
              ↻ Refresh
            </button>
          </div>

          {/* Disclaimer Banner */}
          <div className="rounded-lg border border-[#2a2a2a] bg-[#121212] p-3 text-[11px] text-[#737373] leading-relaxed flex items-start gap-2">
            <span className="text-sm shrink-0">ℹ️</span>
            <span>
              <strong>Planning Disclaimer:</strong> Saved booking plans store a quote snapshot for
              your opening-night coordination. They do not hold or confirm actual cinema tickets.
            </span>
          </div>

          {/* List of Saved Plans */}
          {isLoadingBookings ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[#222222] bg-[#161616] p-5 h-32 animate-pulse"
                />
              ))}
            </div>
          ) : savedBookings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#262626] bg-[#121212] p-8 text-center space-y-2">
              <span className="text-3xl">📭</span>
              <h4 className="text-sm font-semibold text-white">No Saved Plans</h4>
              <p className="text-xs text-[#737373] max-w-xs mx-auto">
                Once you calculate an exact bundle combination, click &quot;Save Booking Plan&quot;
                to preserve the snapshot here.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
              {savedBookings.map((plan) => (
                <SavedBookingCard key={plan._id} booking={plan} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Cinema Modal */}
      <CinemaFormModal
        isOpen={isCinemaModalOpen}
        onClose={() => setIsCinemaModalOpen(false)}
        onSuccess={() => {
          showNotification('success', 'Cinema added successfully!');
          fetchCinemas();
        }}
      />
    </Layout>
  );
}
