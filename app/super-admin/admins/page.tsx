'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layouts';
import { Button, Card } from '@/components/ui';


/**
 * Super admin - Manage admins page
 */
export default function ManageAdminsPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'admin' });
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }

    const parsed = JSON.parse(adminData);
    if (parsed.role !== 'super_admin') {
      router.push('/admin/dashboard');
      return;
    }

    setAdmin(parsed);
    fetchAdmins(token);
  }, [router]);

  const fetchAdmins = async (token: string) => {
    try {
      const response = await fetch('/api/v1/super-admin/admins', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin');
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      setAdmins(data.admins || []);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch('/api/v1/super-admin/admins', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create admin');
        return;
      }

      setShowCreateForm(false);
      setFormData({ email: '', password: '', role: 'admin' });
      fetchAdmins(token);
    } catch (err) {
      setError('An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-[#64748B]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <Sidebar user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Manage Admins</h1>
            <p className="text-[#64748B]">
              Create and manage administrator accounts
              {admin && (
                <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 text-[#4F46E5]">
                  Super Admin
                </span>
              )}
            </p>
          </div>

          {/* Create Admin Button */}
          <div className="mb-6">
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:shadow-lg transition-all"
            >
              {showCreateForm ? 'Cancel' : '+ Create Admin'}
            </Button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <Card className="mb-6">
              <h2 className="text-xl font-semibold text-[#0F172A] mb-4">Create New Admin</h2>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-[#16A34A] to-[#22C55E] hover:shadow-lg transition-all"
                >
                  Create Admin
                </Button>
              </form>
            </Card>
          )}

          {/* Admins List */}
          <Card>
            <h2 className="text-xl font-semibold text-[#0F172A] mb-4">
              All Admins <span className="text-[#64748B] text-lg ml-2">({admins.length})</span>
            </h2>
            {admins.length === 0 ? (
              <p className="text-[#64748B] text-center py-8">No admins found</p>
            ) : (
              <div className="space-y-3">
                {admins.map((a) => (
                  <div key={a.adminId} className="border-b border-[#E2E8F0] pb-3 last:border-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-[#0F172A]">{a.email}</div>
                        <div className="text-sm text-[#64748B]">
                          Created: {new Date(a.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${a.role === 'super_admin'
                          ? 'bg-gradient-to-r from-[#F59E0B]/20 to-[#FBBF24]/20 text-[#F59E0B]'
                          : 'bg-gradient-to-r from-[#0EA5E9]/20 to-[#38BDF8]/20 text-[#0EA5E9]'
                        }`}>
                        {a.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
