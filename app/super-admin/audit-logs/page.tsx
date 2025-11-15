'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Super admin - Audit logs page
 */
export default function AuditLogsPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ userId: '', pollId: '', action: '' });

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
    fetchLogs(token);
  }, [router]);

  const fetchLogs = async (token: string) => {
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.pollId) params.append('pollId', filters.pollId);
      if (filters.action) params.append('action', filters.action);

      const response = await fetch(`/api/v1/super-admin/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin');
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token && admin) {
      fetchLogs(token);
    }
  }, [filters]);

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
        <h1 className="text-3xl font-bold text-[#0f172a] mb-6">Audit Logs</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Filters</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-1">User ID</label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                placeholder="Filter by user ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-1">Poll ID</label>
              <input
                type="text"
                value={filters.pollId}
                onChange={(e) => handleFilterChange('pollId', e.target.value)}
                className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                placeholder="Filter by poll ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-1">Action</label>
              <input
                type="text"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                placeholder="Filter by action"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Logs ({logs.length})</h2>
            {logs.length === 0 ? (
              <p className="text-[#64748b]">No logs found</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.logId} className="border-b border-[#e2e8f0] pb-3 last:border-0 text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-[#0f172a]">{log.action}</div>
                        <div className="text-[#64748b] mt-1">
                          {log.userId && `User: ${log.userId} • `}
                          {log.pollId && `Poll: ${log.pollId} • `}
                          {log.role && `Role: ${log.role} • `}
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                        {log.details && (
                          <div className="text-[#64748b] mt-1 text-xs">
                            {JSON.stringify(log.details)}
                          </div>
                        )}
                      </div>
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


