'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

interface NavbarProps {
  user?: {
    email: string;
    role: string;
  };
}

/**
 * Top navigation bar component
 * Sticky, with blur background, max-width 1280px
 */
export const Navbar = ({ user }: NavbarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin');
    window.location.href = '/';
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 md:h-20 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="font-bold text-2xl text-[#4F46E5]">
            FAIR
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <span className="text-[#334155] text-sm">
                  {user.email}
                </span>
                <Button
                  onClick={handleLogout}
                  variant="secondary"
                  size="sm"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/admin/login">
                  <Button variant="secondary" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-[#F8FAFC]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-3">
            {user ? (
              <>
                <p className="text-[#334155] text-sm px-2">
                  {user.email}
                </p>
                <Button
                  onClick={handleLogout}
                  variant="secondary"
                  className="w-full"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/admin/login" className="block">
                  <Button variant="secondary" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link href="/signup" className="block">
                  <Button className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
