'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  items: SidebarItem[];
  isOpen?: boolean;
  onToggle?: () => void;
}

/**
 * Sidebar component for admin/dashboard navigation
 * Collapsible, 260-300px wide
 */
export const Sidebar = ({ items, isOpen = true, onToggle }: SidebarProps) => {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onToggle}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative left-0 top-0 h-screen md:h-auto bg-white dark:bg-[#1F2937] border-r border-[#E2E8F0] dark:border-[#374151] transition-transform duration-300 z-50 md:z-0 ${
          isOpen ? 'w-64 md:w-60' : '-translate-x-full md:translate-x-0 md:w-20'
        }`}
      >
        <div className="p-6 md:p-4 space-y-4 mt-16 md:mt-0">
          {/* Navigation items */}
          <nav className="space-y-2">
            {items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#EEF2FF] dark:bg-[#312E81] text-[#4F46E5] dark:text-[#818CF8] font-semibold'
                        : 'text-[#334155] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#111827]'
                    }`}
                  >
                    <span className={`text-lg ${!isOpen && 'md:mx-auto'}`}>
                      {item.icon}
                    </span>
                    {isOpen && <span className={`text-sm font-medium`}>{item.label}</span>}
                  </a>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};
