'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components/ui';
import { Sidebar } from '@/components/layouts';

const sidebarItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { label: 'Hackathons', href: '/admin/hackathons', icon: '🏆' },
  // Templates have been removed from the admin UI; keep the sidebar focused on active features.
  { label: 'Polls', href: '/admin/polls', icon: '🗳️' },
];

/**
 * Admin dashboard page with sidebar and modern design
 */
export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [decisions, setDecisions] = useState<{ created: any[]; participated: any[] }>({ created: [], participated: [] });
  const [loading, setLoading] = useState(true);
  const [showAllHackathons, setShowAllHackathons] = useState(false);
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

    // Fetch dashboard data
    fetchDashboard(token);
    fetchDecisions(token);
  }, [router]);

  const fetchDecisions = async (token: string) => {
    try {
      const response = await fetch('/api/v1/admin/dashboard/decisions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setDecisions({
          created: data.decisionsCreated || [],
          participated: data.decisionsParticipated || [],
        });
      }
    } catch (error) {
      console.error('Error fetching decisions:', error);
    }
  };

  const fetchDashboard = async (token: string) => {
    try {
      const [dashboardRes, hackathonsRes] = await Promise.all([
        fetch('/api/v1/admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/v1/admin/hackathons', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (dashboardRes.status === 401 || hackathonsRes.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin');
        router.push('/admin/login');
        return;
      }

      if (!dashboardRes.ok) {
        console.error('Failed to fetch dashboard:', dashboardRes.status, dashboardRes.statusText);
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
          recentPolls: [],
          allPolls: [],
          allHackathons: [],
        });
        setHackathons([]);
        setLoading(false);
        return;
      }

      const dashboardData = await dashboardRes.json();
      const hackathonsData = await hackathonsRes.json();

      if (!dashboardData.stats) {
        dashboardData.stats = {
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
        };
      }

      setDashboard(dashboardData);
      setHackathons(hackathonsData.hackathons || []);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
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
        recentPolls: [],
        allPolls: [],
        allHackathons: [],
      });
      setHackathons([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-[#334155]">Loading...</div>
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
            <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Dashboard</h1>
            <p className="text-[#64748B]">
              Welcome back, {admin?.email}
              <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 text-[#4F46E5]">
                {admin?.role === 'hackathon_manager' ? 'Hackathon Manager' : admin?.role === 'organiser' ? 'Organiser' : admin?.role?.replace('_', ' ')}
              </span>
            </p>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Hackathons', value: dashboard?.stats?.totalHackathons || 0, icon: '🏆', gradient: 'from-[#7C3AED] to-[#A78BFA]', borderColor: 'border-[#7C3AED]' },
              { label: 'Total Polls', value: dashboard?.stats?.totalPolls || 0, icon: '📊', gradient: 'from-[#4F46E5] to-[#6366F1]', borderColor: 'border-[#4F46E5]' },
              { label: 'Active Polls', value: dashboard?.stats?.activePolls || 0, icon: '⚡', gradient: 'from-[#0EA5E9] to-[#38BDF8]', borderColor: 'border-[#0EA5E9]' },
              { label: 'Total Votes', value: dashboard?.stats?.totalVotes || 0, icon: '🗳️', gradient: 'from-[#16A34A] to-[#22C55E]', borderColor: 'border-[#16A34A]' },
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

          {/* Actions section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-6">My Hackathons</h2>
            <div className="flex gap-4 mb-6">
              <Link href="/admin/hackathons/create">
                <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:shadow-lg transition-all">
                  Create Hackathon
                </Button>
              </Link>
              <Button variant="secondary" onClick={() => setShowAllHackathons(true)} className="border-[#E2E8F0] hover:bg-[#F8FAFC]">
                View All
              </Button>
            </div>

            {hackathons.length === 0 ? (
              <Card className="text-center py-12 bg-gradient-to-br from-white to-[#F8FAFC]">
                <p className="text-[#64748B] mb-4">
                  No hackathons yet. Create your first hackathon to get started.
                </p>
                <Link href="/admin/hackathons/create">
                  <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1]">Create Hackathon</Button>
                </Link>
              </Card>
            ) : (
              <div className="grid gap-4">
                {hackathons.slice(0, 3).map((hackathon) => (
                  <Card key={hackathon.hackathon_id} className="hover:shadow-xl transition-all border-l-4 border-[#4F46E5]/20 hover:border-[#4F46E5]">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#0F172A] mb-2">{hackathon.name}</h3>
                        {hackathon.description && (
                          <p className="text-sm text-[#64748B] mt-2">{hackathon.description}</p>
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

          {/* My Decisions Section */}
          {(decisions.created.length > 0 || decisions.participated.length > 0) && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-[#0F172A] mb-6">My Decisions</h2>

              {/* Decisions Created */}
              {decisions.created.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Decisions I Created</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {decisions.created.map((decision: any) => (
                      <Link key={decision.hackathonId} href={`/admin/hackathons/${decision.hackathonId}`}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{decision.hackathonName}</h4>
                            {/* Map decision status to a valid Badge variant for consistent styling */}
                            <Badge variant={
                              decision.status === 'live' ? 'success' :
                              decision.status === 'draft' ? 'warning' :
                              decision.status === 'closed' ? 'secondary' : 'secondary'
                            }>
                              {decision.status}
                            </Badge>
                          </div>
                          {decision.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{decision.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                              {decision.governanceModel?.replace('_', ' ') || 'Custom'}
                            </span>
                            <span className={`px-2 py-1 rounded ${
                              decision.integrityStatus === 'verifiable' ? 'bg-green-100 text-green-700' :
                              decision.integrityStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {decision.integrityStatus}
                            </span>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Decisions Participated In */}
              {decisions.participated.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Decisions I Participated In</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {decisions.participated.map((decision: any) => (
                      <Link key={decision.hackathonId} href={`/admin/hackathons/${decision.hackathonId}`}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{decision.hackathonName}</h4>
                            {/* Use a neutral badge variant to label the participant role */}
                            <Badge variant="secondary">{decision.role}</Badge>
                          </div>
                          {decision.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{decision.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                              {decision.governanceModel?.replace('_', ' ') || 'Custom'}
                            </span>
                            <span className={`px-2 py-1 rounded ${
                              decision.integrityStatus === 'verifiable' ? 'bg-green-100 text-green-700' :
                              decision.integrityStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {decision.integrityStatus}
                            </span>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* All Hackathons Modal */}
          {showAllHackathons && (
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4"
              onClick={() => setShowAllHackathons(false)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              onKeyDown={(e) => e.key === 'Escape' && setShowAllHackathons(false)}
            >
              <Card className="max-w-2xl w-full max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-4">
                  <h2 id="modal-title" className="text-2xl font-bold text-[#0F172A]">All Hackathons</h2>
                  <button
                    onClick={() => setShowAllHackathons(false)}
                    className="text-[#64748B] hover:text-[#0F172A] text-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#4F46E5] rounded"
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>

                {dashboard?.allHackathons && dashboard.allHackathons.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.allHackathons.map((hackathon: any) => (
                      <Link
                        key={hackathon.hackathon_id}
                        href={`/admin/hackathons/${hackathon.hackathon_id}`}
                        className="block p-3 border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] hover:border-[#4F46E5]/30 transition-all focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                      >
                        <div className="font-semibold text-[#0F172A]">{hackathon.name}</div>
                        {hackathon.description && (
                          <p className="text-sm text-[#64748B] line-clamp-1">{hackathon.description}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-[#64748B]">No hackathons found</p>
                )}
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
