import React from 'react';
import { Navbar } from './Navbar.tsx';

export interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f0f] text-[#f5f5f5]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">{children}</main>

      <footer className="border-t border-[#2a2a2a] bg-[#0b0b0b] py-8 text-xs text-[#737373]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-medium text-[#a3a3a3]">
              Doomsday Ready — MCU Preparation &amp; Opening Night Booking Tool
            </span>
            <div className="flex gap-4 text-[#525252]">
              <span>Vite + React + Tailwind + Express + MongoDB</span>
            </div>
          </div>

          {/* TMDB Visible Attribution & Logo */}
          <div className="border-t border-[#1c1c1c] pt-5 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <a
                href="https://www.themoviedb.org/"
                target="_blank"
                rel="noopener noreferrer"
                title="The Movie Database (TMDB)"
                className="shrink-0 hover:opacity-85 transition-opacity"
              >
                <img
                  src="/tmdb-logo.svg"
                  alt="The Movie Database (TMDB) Logo"
                  className="h-8 w-auto"
                />
              </a>
              <p className="text-[11px] text-[#888888] leading-relaxed max-w-xl text-center sm:text-left">
                This product uses the TMDB API but is not endorsed or certified by TMDB. Movie
                metadata and poster image assets are sourced from{' '}
                <a
                  href="https://www.themoviedb.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#a3a3a3] hover:text-white underline transition-colors"
                >
                  The Movie Database (TMDB)
                </a>
                .
              </p>
            </div>
            <span className="text-[10px] text-[#555555] shrink-0">
              Assessment MCU Watch Planner
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
