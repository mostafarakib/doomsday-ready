import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { BackendStatusBannerView } from '../BackendStatusBanner.tsx';

describe('BackendStatusBannerView', () => {
  it('renders null when backend is available', () => {
    const html = renderToString(
      React.createElement(BackendStatusBannerView, { isAvailable: true }),
    );
    expect(html).toBe('');
  });

  it('renders the non-blocking status banner when backend is unavailable', () => {
    const html = renderToString(
      React.createElement(BackendStatusBannerView, { isAvailable: false }),
    );

    // Exact text requirement
    expect(html).toContain('Server temporarily unavailable. We&#x27;re reconnecting...');

    // Accessible attributes
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');

    // Visual indicator
    expect(html).toContain('animate-ping');
  });
});
