'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layouts';
import { Card } from '@/components/ui';


/**
 * Super admin - Audit logs page
 */
export default function AuditLogsPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
            <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Audit Logs</h1>
            <p className="text-[#64748B]">
              Track all system activities and user actions
              {admin && (
                <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 text-[#4F46E5]">
                  Super Admin
                </span>
              )}
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Filters</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">User ID</label>
                <input
                  type="text"
                  value={filters.userId}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
                  placeholder="Filter by user ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Poll ID</label>
                <input
                  type="text"
                  value={filters.pollId}
                  onChange={(e) => handleFilterChange('pollId', e.target.value)}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
                  placeholder="Filter by poll ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Action</label>
                <input
                  type="text"
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
                  placeholder="Filter by action"
                />
              </div>
            </div>
          </Card>

          {/* Logs List */}
          <Card>
            <h2 className="text-xl font-semibold text-[#0F172A] mb-4">
              Logs <span className="text-[#64748B] text-lg ml-2">({logs.length})</span>
            </h2>
            {logs.length === 0 ? (
              <p className="text-[#64748B] text-center py-8">No logs found</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.logId} className="border-b border-[#E2E8F0] pb-3 last:border-0 text-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-[#0F172A] mb-1">{log.action}</div>
                        <div className="text-[#64748B] text-xs">
                          {log.userId && `User: ${log.userId} • `}
                          {log.pollId && `Poll: ${log.pollId} • `}
                          {log.role && `Role: ${log.role} • `}
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                        {log.details && (
                          <div className="text-[#64748B] mt-1 text-xs bg-[#F8FAFC] p-2 rounded">
                            {JSON.stringify(log.details)}
                          </div>
                        )}
                      </div>
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
