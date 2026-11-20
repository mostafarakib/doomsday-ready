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

      <footer className="border-t border-[#2a2a2a] bg-[#0b0b0b] py-6 text-center text-xs text-[#737373]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Doomsday Ready — MCU Preparation & Opening Night Booking Tool</span>
          <div className="flex gap-4">
            <span className="text-[#525252]">Vite + React + Tailwind + Express</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
