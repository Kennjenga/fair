'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SidebarItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  items: SidebarItem[];
  user?: {
    email: string;
    role: string;
  };
  isOpen?: boolean;
  onToggle?: () => void;
}

/**
 * Sidebar component for admin/dashboard navigation
 * Minimal design inspired by homepage with gradient accents
 */
export const Sidebar = ({ items, user, isOpen = true, onToggle }: SidebarProps) => {
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
        className="fixed md:sticky left-0 md:left-0 top-0 md:top-4 h-screen md:h-[calc(100vh-2rem)] bg-white md:rounded-2xl border-r md:border border-[#E2E8F0] md:shadow-lg transition-all duration-300 z-40 md:z-0 w-64 flex flex-col overflow-hidden md:ml-4"
      >
        {/* Logo/Brand */}
        <div className="p-6 border-b border-[#E2E8F0]">
          <div className="text-2xl font-bold bg-gradient-to-r from-[#4F46E5] to-[#6366F1] bg-clip-text text-transparent">
            FAIR
          </div>
          <p className="text-xs text-[#64748B] mt-1">Admin Dashboard</p>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${isActive
                    ? 'bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 text-[#4F46E5] font-semibold shadow-sm'
                    : 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#4F46E5]'
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1]"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User profile section */}
        {user && (
          <div className="p-4 border-t border-[#E2E8F0] bg-gradient-to-br from-[#F8FAFC] to-white">
            <div className="mb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1] flex items-center justify-center text-white font-semibold">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F172A] truncate">{user.email}</p>
                  <p className="text-xs text-[#64748B] capitalize">{user.role.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm font-medium text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </motion.aside>
    </>
  );
};
