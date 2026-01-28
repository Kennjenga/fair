'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layouts';
import { Card } from '@/components/ui';

/**
 * Profile page for admin users
 */
export default function ProfilePage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }

    const parsed = JSON.parse(adminData);
    setAdmin(parsed);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-[#334155]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Profile</h1>
            <p className="text-[#64748B]">Manage your account information</p>
          </div>

          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-2">Email</label>
                <p className="text-[#0F172A]">{admin?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-2">Role</label>
                <p className="text-[#0F172A] capitalize">{admin?.role?.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-2">Account ID</label>
                <p className="text-[#64748B] text-sm font-mono">{admin?.adminId}</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
