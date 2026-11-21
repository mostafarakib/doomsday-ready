import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildApiUrl } from '../client.ts';

describe('buildApiUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns unchanged relative path when no base URL is defined', () => {
    expect(buildApiUrl('/api/movies', '')).toBe('/api/movies');
    expect(buildApiUrl('/api/health', '')).toBe('/api/health');
    expect(buildApiUrl('/api/movies', '   ')).toBe('/api/movies');
  });

  it('uses import.meta.env.VITE_API_URL when no override is provided', () => {
    vi.stubEnv('VITE_API_URL', 'https://doomsday-ready-2tic.onrender.com/api');
    expect(buildApiUrl('/api/movies')).toBe('https://doomsday-ready-2tic.onrender.com/api/movies');
  });

  it('falls back to relative path when import.meta.env.VITE_API_URL is absent (local dev proxy)', () => {
    vi.stubEnv('VITE_API_URL', '');
    expect(buildApiUrl('/api/movies')).toBe('/api/movies');
  });

  it('prepends base URL without trailing slash', () => {
    const base = 'https://doomsday-ready-2tic.onrender.com';
    expect(buildApiUrl('/api/movies', base)).toBe(
      'https://doomsday-ready-2tic.onrender.com/api/movies',
    );
    expect(buildApiUrl('/api/health', base)).toBe(
      'https://doomsday-ready-2tic.onrender.com/api/health',
    );
  });

  it('handles base URL with trailing slash correctly', () => {
    const base = 'https://doomsday-ready-2tic.onrender.com/';
    expect(buildApiUrl('/api/movies', base)).toBe(
      'https://doomsday-ready-2tic.onrender.com/api/movies',
    );
  });

  it('avoids duplicate /api/api when base URL already ends with /api', () => {
    const baseWithApi = 'https://doomsday-ready-2tic.onrender.com/api';
    expect(buildApiUrl('/api/movies', baseWithApi)).toBe(
      'https://doomsday-ready-2tic.onrender.com/api/movies',
    );
    expect(buildApiUrl('/api/cinemas/123/booking?groupSize=5', baseWithApi)).toBe(
      'https://doomsday-ready-2tic.onrender.com/api/cinemas/123/booking?groupSize=5',
    );
    expect(buildApiUrl('/api/health', baseWithApi)).toBe(
      'https://doomsday-ready-2tic.onrender.com/api/health',
    );
  });

  it('handles base URL ending with /api/ with trailing slash', () => {
    const base = 'https://doomsday-ready-2tic.onrender.com/api/';
    expect(buildApiUrl('/api/movies', base)).toBe(
      'https://doomsday-ready-2tic.onrender.com/api/movies',
    );
    expect(buildApiUrl('/api/health', base)).toBe(
      'https://doomsday-ready-2tic.onrender.com/api/health',
    );
  });

  it('handles endpoints without leading slash', () => {
    const base = 'https://doomsday-ready-2tic.onrender.com';
    expect(buildApiUrl('api/movies', base)).toBe(
      'https://doomsday-ready-2tic.onrender.com/api/movies',
    );
  });
});
