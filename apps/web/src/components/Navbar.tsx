import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/movies', label: 'Movies', badge: null },
    { to: '/rewatch-plan', label: 'Rewatch Plan', badge: null },
    { to: '/booking', label: 'Tickets & Booking', badge: null },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2a2a2a] bg-[#0f0f0f]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-950/60 border border-red-800/80 text-red-500 group-hover:border-red-600 transition-colors shadow-sm shadow-red-950/50">
              <span className="text-lg">🎬</span>
            </span>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-[#f5f5f5] group-hover:text-white transition-colors">
                Doomsday <span className="text-[#dc2626]">Ready</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase text-[#a3a3a3] font-medium -mt-1">
                MCU Prep Tool
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#1e1e1e] text-[#f5f5f5] border border-[#333333] shadow-sm'
                      : 'text-[#a3a3a3] hover:text-[#f5f5f5] hover:bg-[#1a1a1a]'
                  }`
                }
              >
                {link.label}
                {link.badge && (
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#2a2a2a] text-[#888888]">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#a3a3a3] hover:text-white hover:bg-[#1a1a1a] focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#2a2a2a] bg-[#141414] px-4 pt-3 pb-4 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-[#222222] text-white border border-[#333333]'
                    : 'text-[#a3a3a3] hover:text-white hover:bg-[#1a1a1a]'
                }`
              }
            >
              <div className="flex items-center justify-between">
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[#2a2a2a] text-[#888888]">
                    {link.badge}
                  </span>
                )}
              </div>
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
