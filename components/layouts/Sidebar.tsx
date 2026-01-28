'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu, X, Home, User, Settings, LogOut, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface SidebarProps {
  user?: {
    email: string;
    role: string;
    fullName?: string;
    title?: string;
  };
  isOpen?: boolean;
  onToggle?: () => void;
}

/**
 * Decision categories for Create Decision section
 */
const DECISION_CATEGORIES = [
  { label: 'Competitions & Hackathons', slug: 'competitions-hackathons' },
  { label: 'Community Decisions', slug: 'community-decisions' },
  { label: 'Governance & Formal Decisions', slug: 'governance-formal' },
  { label: 'Grants, Funding & Rewards', slug: 'grants-funding-rewards' },
  { label: 'Education & Evaluation', slug: 'education-evaluation' },
  { label: 'Hiring & Talent', slug: 'hiring-talent' },
  { label: 'Programs & Ecosystems', slug: 'programs-ecosystems' },
  { label: 'Integrity-Sensitive Processes', slug: 'integrity-sensitive' },
  { label: 'Custom & Advanced', slug: 'custom-advanced' },
];

/**
 * Sidebar component for admin/dashboard navigation
 * Restructured per requirements: Brand, Navigation, Create Decision, Account
 */
export const Sidebar = ({ user, isOpen = true, onToggle }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin');
    router.push('/admin/login');
  };

  const handleCategoryClick = (categorySlug: string) => {
    // Route to category-specific templates page
    router.push(`/admin/templates/${categorySlug}`);
  };

  // Extract display name from email if fullName not provided
  const displayName = user?.fullName || user?.email?.split('@')[0] || 'User';
  const displayRole = user?.title || user?.role?.replace('_', ' ') || '';

  // On desktop, sidebar should always be visible
  const shouldShow = !isMobile || isOpen;

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={onToggle}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-[#E2E8F0] shadow-lg hover:bg-[#F8FAFC] transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} className="text-[#334155]" /> : <Menu size={24} className="text-[#334155]" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && isMobile && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: shouldShow ? 0 : -280,
        }}
        className="fixed md:sticky left-0 top-0 h-screen bg-white border-r border-[#E2E8F0] transition-all duration-300 z-40 md:z-0 w-64 flex flex-col overflow-hidden"
      >
        {/* 1. Brand & Identity */}
        <div className="p-6 border-b border-[#E2E8F0]">
          <Link href="/admin/dashboard" className="flex items-center gap-3 mb-4 group">
            <div className="relative w-10 h-10">
              <Image
                src="/favicon.ico"
                alt="FAIR Logo"
                width={40}
                height={40}
                className="rounded-lg group-hover:opacity-80 transition-opacity"
                priority
              />
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-[#4F46E5] to-[#6366F1] bg-clip-text text-transparent">
              FAIR
            </div>
          </Link>
          {user && (
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">{displayName}</p>
              {displayRole && (
                <p className="text-xs text-[#64748B] mt-0.5">{displayRole}</p>
              )}
            </div>
          )}
        </div>

        {/* 2. Primary Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* Dashboard */}
          <Link href="/admin/dashboard">
            <motion.div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                pathname === '/admin/dashboard' || pathname.startsWith('/admin/dashboard/')
                  ? 'bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 text-[#4F46E5] font-semibold shadow-sm'
                  : 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#4F46E5]'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Home size={18} className="text-[#64748B]" />
              <span className="text-sm font-medium">Dashboard</span>
              {(pathname === '/admin/dashboard' || pathname.startsWith('/admin/dashboard/')) && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1]"
                />
              )}
            </motion.div>
          </Link>

          {/* 3. Create Decision - Categories with Enhanced Buttons */}
          <div className="mt-6">
            <h3 className="px-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">
              Create Decision
            </h3>
            <div className="space-y-3">
              {DECISION_CATEGORIES.map((category) => (
                <div key={category.slug} className="space-y-1.5">
                  <h4 className="px-4 text-xs font-medium text-[#334155]">{category.label}</h4>
                  <motion.button
                    onClick={() => handleCategoryClick(category.slug)}
                    className="w-full mx-2 px-3 py-2.5 rounded-lg text-xs font-medium text-[#4F46E5] bg-gradient-to-r from-[#4F46E5]/5 to-[#6366F1]/5 border border-[#4F46E5]/10 hover:from-[#4F46E5]/10 hover:to-[#6366F1]/10 hover:border-[#4F46E5]/20 transition-all flex items-center justify-between group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Browse Templates</span>
                    <ArrowRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </motion.button>
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* 4. Account (Bottom, Fixed) */}
        {user && (
          <div className="p-4 border-t border-[#E2E8F0] bg-gradient-to-br from-[#F8FAFC] to-white space-y-1">
            <Link href="/admin/profile">
              <motion.div
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
                  pathname === '/admin/profile' || pathname.startsWith('/admin/profile/')
                    ? 'bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 text-[#4F46E5] font-semibold'
                    : 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#4F46E5]'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <User size={16} className="text-[#64748B]" />
                <span className="text-sm font-medium">Profile</span>
              </motion.div>
            </Link>
            <Link href="/admin/settings">
              <motion.div
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
                  pathname === '/admin/settings' || pathname.startsWith('/admin/settings/')
                    ? 'bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 text-[#4F46E5] font-semibold'
                    : 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#4F46E5]'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Settings size={16} className="text-[#64748B]" />
                <span className="text-sm font-medium">Settings</span>
              </motion.div>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        )}
      </motion.aside>
    </>
  );
};
