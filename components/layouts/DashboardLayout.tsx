'use client';

import { ReactNode } from 'react';
import React, { useState } from 'react';
import { Navbar, Sidebar } from '@/components/layouts';
import { Card } from '@/components/ui';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  sidebarItems?: Array<{ label: string; href: string; icon: string }>;
  user?: {
    email: string;
    role: string;
  };
}

/**
 * Dashboard layout wrapper
 * Includes Navbar, Sidebar, and main content area
 */
export const DashboardLayout = ({
  children,
  title,
  sidebarItems = [],
  user,
}: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navbar */}
      <Navbar user={user} />

      <div className="flex">
        {/* Sidebar */}
        {sidebarItems.length > 0 && (
          <Sidebar items={sidebarItems} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        )}

        {/* Main content */}
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl">
            {title && (
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-[#0F172A]">
                  {title}
                </h1>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

