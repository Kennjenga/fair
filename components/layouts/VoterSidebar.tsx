'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Menu, X, Award, Vote, Shield, User, LogOut } from 'lucide-react';
import { Logo } from '@/components/ui';

interface VoterSidebarProps {
  userEmail?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

/**
 * Sidebar for voter dashboard: hackathons participated, polls, blockchain, profile, log out.
 */
export function VoterSidebar({ userEmail, isOpen = true, onToggle }: VoterSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const isDashboard = pathname === '/voter/dashboard';

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('voter_token');
    localStorage.removeItem('voter');
    router.push('/admin/login?as=voter');
  };

  const scrollTo = (id: string) => {
    if (!isDashboard) return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    if (isMobile && onToggle) onToggle();
  };

  const shouldShow = !isMobile || isOpen;
  const displayName = userEmail ? userEmail.split('@')[0] : 'Voter';

  return (
    <>
      <button
        onClick={onToggle}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-[#E2E8F0] shadow-lg hover:bg-[#F8FAFC] transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} className="text-[#334155]" /> : <Menu size={24} className="text-[#334155]" />}
      </button>

      {isOpen && isMobile && (
        <div className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onToggle} />
      )}

      <motion.aside
        initial={false}
        animate={{ x: shouldShow ? 0 : -280 }}
        className="fixed md:sticky left-0 top-0 h-screen bg-white border-r border-[#E2E8F0] transition-all duration-300 z-40 md:z-0 w-64 flex flex-col overflow-hidden"
      >
        {/* Brand & user */}
        <div className="p-6 border-b border-[#E2E8F0]">
          <Link href="/voter/dashboard" className="flex items-center gap-3 mb-4 group">
            <Logo size={32} showText={true} />
          </Link>
          {userEmail && (
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">{displayName}</p>
              <p className="text-xs text-[#64748B] truncate mt-0.5" title={userEmail}>
                {userEmail}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <h3 className="px-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">
            Your activity
          </h3>

          {isDashboard ? (
            <>
              <button
                type="button"
                onClick={() => scrollTo('hackathons')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#334155] hover:bg-[#F8FAFC] hover:text-[#4F46E5] transition-all text-left"
              >
                <Award size={18} className="text-[#64748B]" />
                <span className="text-sm font-medium">Hackathons participated</span>
              </button>
              <button
                type="button"
                onClick={() => scrollTo('polls')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#334155] hover:bg-[#F8FAFC] hover:text-[#4F46E5] transition-all text-left"
              >
                <Vote size={18} className="text-[#64748B]" />
                <span className="text-sm font-medium">Polls participated</span>
              </button>
              <button
                type="button"
                onClick={() => scrollTo('polls')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#334155] hover:bg-[#F8FAFC] hover:text-[#4F46E5] transition-all text-left"
              >
                <Shield size={18} className="text-[#64748B]" />
                <span className="text-sm font-medium">Blockchain transactions</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/voter/dashboard#participated-in">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#334155] hover:bg-[#F8FAFC] hover:text-[#4F46E5] transition-all">
                  <Award size={18} className="text-[#64748B]" />
                  <span className="text-sm font-medium">Participated In</span>
                </div>
              </Link>
              <Link href="/voter/dashboard#polls">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#334155] hover:bg-[#F8FAFC] hover:text-[#4F46E5] transition-all">
                  <Vote size={18} className="text-[#64748B]" />
                  <span className="text-sm font-medium">Polls participated</span>
                </div>
              </Link>
              <Link href="/voter/dashboard#polls">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#334155] hover:bg-[#F8FAFC] hover:text-[#4F46E5] transition-all">
                  <Shield size={18} className="text-[#64748B]" />
                  <span className="text-sm font-medium">Blockchain transactions</span>
                </div>
              </Link>
            </>
          )}
        </nav>

        {/* Profile & Log out */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]/50 space-y-1">
          <Link href="/voter/profile">
            <motion.div
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                pathname === '/voter/profile' ? 'bg-[#4F46E5]/10 text-[#4F46E5] font-semibold' : 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#4F46E5]'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <User size={16} className="text-[#64748B]" />
              <span className="text-sm font-medium">Profile</span>
            </motion.div>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
          >
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
