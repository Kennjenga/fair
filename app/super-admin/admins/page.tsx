'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Super admin - Manage admins page
 */
export default function ManageAdminsPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-[#64748b]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b border-[#e2e8f0]">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/super-admin/dashboard" className="text-2xl font-bold text-[#1e40af]">
            FAIR Super Admin
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[#64748b]">{admin?.email}</span>
            <button
              onClick={handleLogout}
              className="text-[#dc2626] hover:text-[#b91c1c] text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#0f172a]">Manage Admins</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-[#1e40af] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#1e3a8a] transition-colors"
          >
            {showCreateForm ? 'Cancel' : 'Create Admin'}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Create New Admin</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-[#059669] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#047857] transition-colors"
              >
                Create Admin
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#0f172a] mb-4">All Admins</h2>
            {admins.length === 0 ? (
              <p className="text-[#64748b]">No admins found</p>
            ) : (
              <div className="space-y-3">
                {admins.map((a) => (
                  <div key={a.adminId} className="border-b border-[#e2e8f0] pb-3 last:border-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-[#0f172a]">{a.email}</div>
                        <div className="text-sm text-[#64748b]">
                          Role: {a.role} • Created: {new Date(a.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded text-sm font-medium ${
                        a.role === 'super_admin' 
                          ? 'bg-[#d97706] text-white' 
                          : 'bg-[#0891b2] text-white'
                      }`}>
                        {a.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


