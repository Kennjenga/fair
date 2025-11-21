'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layouts';
import { Button, Card } from '@/components/ui';

const sidebarItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { label: 'Hackathons', href: '/admin/hackathons', icon: '🏆' },
  { label: 'Polls', href: '/admin/polls', icon: '🗳️' },
];

/**
 * Hackathons list page
 */
export default function HackathonsPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }

    const parsed = JSON.parse(adminData);
    setAdmin(parsed);

    // Fetch hackathons and dashboard data
    fetchData(token);
  }, [router]);

  const fetchData = async (token: string) => {
    try {
      const [hackathonsRes, dashboardRes] = await Promise.all([
        fetch('/api/v1/admin/hackathons', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/v1/admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (hackathonsRes.status === 401 || dashboardRes.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin');
        router.push('/admin/login');
        return;
      }

      const hackathonsData = await hackathonsRes.json();
      const dashboardData = dashboardRes.ok ? await dashboardRes.json() : null;

      setHackathons(hackathonsData.hackathons || []);

      // Set dashboard stats with defaults if needed
      if (dashboardData && dashboardData.stats) {
        setDashboard(dashboardData);
      } else {
        setDashboard({
          stats: {
            totalHackathons: hackathonsData.hackathons?.length || 0,
            totalPolls: 0,
            activePolls: 0,
            endedPolls: 0,
            upcomingPolls: 0,
            totalVotes: 0,
            totalTokens: 0,
            usedTokens: 0,
            totalTeams: 0,
            totalJudges: 0,
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Set defaults on error
      setDashboard({
        stats: {
          totalHackathons: 0,
          totalPolls: 0,
          activePolls: 0,
          endedPolls: 0,
          upcomingPolls: 0,
          totalVotes: 0,
          totalTokens: 0,
          usedTokens: 0,
          totalTeams: 0,
          totalJudges: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-[#64748b]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <Sidebar items={sidebarItems} user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Hackathons</h1>
            <p className="text-[#64748B]">
              {admin?.role === 'hackathon_manager'
                ? 'Manage your hackathons and track participation'
                : 'Organize and oversee all hackathon events'}
            </p>
          </div>

          {/* Analytics Statistics */}
          {dashboard?.stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { label: 'Total Hackathons', value: dashboard.stats.totalHackathons || 0, icon: '🏆', gradient: 'from-[#7C3AED] to-[#A78BFA]', borderColor: 'border-[#7C3AED]' },
                { label: 'Total Polls', value: dashboard.stats.totalPolls || 0, icon: '📊', gradient: 'from-[#4F46E5] to-[#6366F1]', borderColor: 'border-[#4F46E5]' },
                { label: 'Active Polls', value: dashboard.stats.activePolls || 0, icon: '⚡', gradient: 'from-[#0EA5E9] to-[#38BDF8]', borderColor: 'border-[#0EA5E9]' },
                { label: 'Total Teams', value: dashboard.stats.totalTeams || 0, icon: '👥', gradient: 'from-[#16A34A] to-[#22C55E]', borderColor: 'border-[#16A34A]' },
              ].map((stat, idx) => (
                <Card
                  key={idx}
                  className={`hover:shadow-2xl transition-all duration-300 motion-reduce:transition-none border-l-4 ${stat.borderColor} group`}
                  role="region"
                  aria-label={`${stat.label}: ${stat.value}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#64748B] text-sm font-medium mb-2">{stat.label}</p>
                      <p className={`text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent transition-transform group-hover:scale-105 duration-300 motion-reduce:transform-none`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className="text-5xl opacity-80 transition-transform group-hover:scale-110 group-hover:rotate-6 duration-300 motion-reduce:transform-none" aria-hidden="true">{stat.icon}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-[#0F172A]">My Hackathons</h2>
            <Link href="/admin/hackathons/create">
              <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:shadow-lg transition-all">
                Create New Hackathon
              </Button>
            </Link>
          </div>

          {hackathons.length === 0 ? (
            <Card className="text-center py-12 bg-gradient-to-br from-white to-[#F8FAFC]">
              <p className="text-[#64748B] mb-4">No hackathons yet. Create your first hackathon to get started.</p>
              <Link href="/admin/hackathons/create">
                <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1]">Create Hackathon</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-4">
              {hackathons.map((hackathon) => (
                <Card key={hackathon.hackathon_id} className="hover:shadow-xl transition-all border-l-4 border-[#4F46E5]/20 hover:border-[#4F46E5]">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-[#0F172A] mb-2">{hackathon.name}</h3>
                      {hackathon.description && (
                        <p className="text-sm text-[#64748B] mb-2">{hackathon.description}</p>
                      )}
                      {(hackathon.start_date || hackathon.end_date) && (
                        <p className="text-sm text-[#64748B]">
                          {hackathon.start_date && new Date(hackathon.start_date).toLocaleDateString()}
                          {hackathon.start_date && hackathon.end_date && ' - '}
                          {hackathon.end_date && new Date(hackathon.end_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Link href={`/admin/hackathons/${hackathon.hackathon_id}`}>
                      <Button size="sm" className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:shadow-lg transition-all">
                        Manage
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

