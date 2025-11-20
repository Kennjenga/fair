'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components/ui';
import { Navbar } from '@/components/layouts';

/**
 * Admin dashboard page with design system
 */
export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAllHackathons, setShowAllHackathons] = useState(false);
  const [showAllPolls, setShowAllPolls] = useState(false);
  const [hackathonSearchQuery, setHackathonSearchQuery] = useState('');
  const [pollSearchQuery, setPollSearchQuery] = useState('');
  const [pollFilter, setPollFilter] = useState<'all' | 'active' | 'ended' | 'upcoming'>('all');

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
  }, [router]);

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
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navbar */}
      <Navbar user={admin || undefined} />

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Dashboard</h1>
          <p className="text-[#334155]">Welcome back, {admin?.email}</p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Hackathons', value: dashboard?.stats?.totalHackathons || 0, icon: '🏆', color: '#7C3AED' },
            { label: 'Total Polls', value: dashboard?.stats?.totalPolls || 0, icon: '📊', color: '#4F46E5' },
            { label: 'Active Polls', value: dashboard?.stats?.activePolls || 0, icon: '⚡', color: '#0EA5E9' },
            { label: 'Total Votes', value: dashboard?.stats?.totalVotes || 0, icon: '✓', color: '#16A34A' },
          ].map((stat, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#334155] text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-[#0F172A] mt-2">{stat.value}</p>
                </div>
                <div className="text-4xl">{stat.icon}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Actions section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#0F172A] mb-4">My Hackathons</h2>
          <div className="flex gap-4 mb-6">
            <Link href="/admin/hackathons/create">
              <Button>Create Hackathon</Button>
            </Link>
            <Button variant="secondary" onClick={() => setShowAllHackathons(true)}>
              View All
            </Button>
          </div>

          {hackathons.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-[#334155] mb-4">
                No hackathons yet. Create your first hackathon to get started.
              </p>
              <Link href="/admin/hackathons/create">
                <Button>Create Hackathon</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-4">
              {hackathons.slice(0, 3).map((hackathon) => (
                <Card key={hackathon.hackathon_id} className="hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#0F172A]">{hackathon.name}</h3>
                      {hackathon.description && (
                        <p className="text-sm text-[#334155] mt-2">{hackathon.description}</p>
                      )}
                    </div>
                    <Link href={`/admin/hackathons/${hackathon.hackathon_id}`}>
                      <Button size="sm">Manage</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* All Hackathons Modal */}
        {showAllHackathons && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-4">
                <h2 className="text-2xl font-bold text-[#0F172A]">All Hackathons</h2>
                <button
                  onClick={() => setShowAllHackathons(false)}
                  className="text-[#334155] hover:text-[#0F172A] text-2xl"
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
                      className="block p-3 border border-[#E2E8F0] rounded-lg hover:bg-[#F3F4F6] transition-colors"
                    >
                      <div className="font-semibold text-[#0F172A]">{hackathon.name}</div>
                      {hackathon.description && (
                        <p className="text-sm text-[#334155] line-clamp-1">{hackathon.description}</p>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-[#334155]">No hackathons found</p>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

  const [hackathons, setHackathons] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAllHackathons, setShowAllHackathons] = useState(false);
  const [showAllPolls, setShowAllPolls] = useState(false);
  const [hackathonSearchQuery, setHackathonSearchQuery] = useState('');
  const [pollSearchQuery, setPollSearchQuery] = useState('');
  const [pollFilter, setPollFilter] = useState<'all' | 'active' | 'ended' | 'upcoming'>('all');

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
  }, [router]);

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
        // Set default stats if API fails
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
      
      console.log('Admin dashboard data:', dashboardData); // Debug log
      
      // Ensure stats object exists with defaults
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
      // Set default stats on error
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
      {/* Header */}
      <header className="bg-white border-b border-[#e2e8f0]">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#1e40af]">FAIR Admin Dashboard</h1>
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
        {/* Statistics - Always show, even if loading or no data */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            <div 
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-[#7c3aed]"
              onClick={() => {
                setShowAllHackathons(true);
                setHackathonSearchQuery('');
              }}
            >
              <div className="text-3xl font-bold text-[#7c3aed]">{dashboard?.stats?.totalHackathons || 0}</div>
              <div className="text-sm text-[#64748b] mt-1">Hackathons</div>
              <div className="text-xs text-[#0891b2] mt-2">Click to view all</div>
            </div>
            <div 
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-[#1e40af]"
              onClick={() => {
                setShowAllPolls(true);
                setPollFilter('all');
                setPollSearchQuery('');
              }}
            >
              <div className="text-3xl font-bold text-[#1e40af]">{dashboard?.stats?.totalPolls || 0}</div>
              <div className="text-sm text-[#64748b] mt-1">Total Polls</div>
              <div className="text-xs text-[#0891b2] mt-2">Click to view all</div>
            </div>
            <div 
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-[#0891b2]"
              onClick={() => {
                setShowAllPolls(true);
                setPollFilter('active');
                setPollSearchQuery('');
              }}
            >
              <div className="text-3xl font-bold text-[#0891b2]">{dashboard?.stats?.activePolls || 0}</div>
              <div className="text-sm text-[#64748b] mt-1">Active Polls</div>
              <div className="text-xs text-[#0891b2] mt-2">Click to view</div>
            </div>
            <div 
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-[#dc2626]"
              onClick={() => {
                setShowAllPolls(true);
                setPollFilter('ended');
                setPollSearchQuery('');
              }}
            >
              <div className="text-3xl font-bold text-[#dc2626]">{dashboard?.stats?.endedPolls || 0}</div>
              <div className="text-sm text-[#64748b] mt-1">Ended Polls</div>
              <div className="text-xs text-[#0891b2] mt-2">Click to view</div>
            </div>
            <div 
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-[#f59e0b]"
              onClick={() => {
                setShowAllPolls(true);
                setPollFilter('upcoming');
                setPollSearchQuery('');
              }}
            >
              <div className="text-3xl font-bold text-[#f59e0b]">{dashboard?.stats?.upcomingPolls || 0}</div>
              <div className="text-sm text-[#64748b] mt-1">Upcoming Polls</div>
              <div className="text-xs text-[#0891b2] mt-2">Click to view</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-[#059669]">
              <div className="text-3xl font-bold text-[#059669]">{dashboard?.stats?.totalVotes || 0}</div>
              <div className="text-sm text-[#64748b] mt-1">Total Votes</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-[#475569]">
              <div className="text-3xl font-bold text-[#475569]">{dashboard?.stats?.totalTokens || 0}</div>
              <div className="text-sm text-[#64748b] mt-1">Total Tokens</div>
              <div className="text-xs text-[#64748b] mt-1">
                {dashboard?.stats?.usedTokens || 0} used ({dashboard?.stats?.totalTokens > 0 
                  ? Math.round(((dashboard?.stats?.usedTokens || 0) / dashboard?.stats?.totalTokens) * 100) 
                  : 0}%)
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-[#0891b2]">
              <div className="text-3xl font-bold text-[#0891b2]">{dashboard?.stats?.totalTeams || 0}</div>
              <div className="text-sm text-[#64748b] mt-1">Total Teams</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-[#7c3aed]">
              <div className="text-3xl font-bold text-[#7c3aed]">{dashboard?.stats?.totalJudges || 0}</div>
              <div className="text-sm text-[#64748b] mt-1">Total Judges</div>
            </div>
          </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-[#0f172a]">My Hackathons</h2>
          <Link
            href="/admin/hackathons/create"
            className="bg-[#1e40af] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#1e3a8a] transition-colors"
          >
            Create New Hackathon
          </Link>
        </div>

        {hackathons.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-[#64748b] mb-4">No hackathons yet. Create your first hackathon to get started.</p>
            <Link
              href="/admin/hackathons/create"
              className="inline-block bg-[#1e40af] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#1e3a8a] transition-colors"
            >
              Create Hackathon
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {hackathons.map((hackathon) => (
              <div key={hackathon.hackathon_id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-[#0f172a] mb-2">{hackathon.name}</h3>
                    {hackathon.description && (
                      <p className="text-sm text-[#64748b] mb-2">{hackathon.description}</p>
                    )}
                    {(hackathon.start_date || hackathon.end_date) && (
                      <p className="text-sm text-[#64748b]">
                        {hackathon.start_date && new Date(hackathon.start_date).toLocaleDateString()}
                        {hackathon.start_date && hackathon.end_date && ' - '}
                        {hackathon.end_date && new Date(hackathon.end_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/admin/hackathons/${hackathon.hackathon_id}`}
                    className="bg-[#0891b2] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0e7490] transition-colors"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Hackathons Modal */}
      {showAllHackathons && (
        <div className="fixed inset-0 bg-[#f8fafc] bg-opacity-60 backdrop-blur-md flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 my-8 border border-[#e2e8f0]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-[#0f172a]">All Hackathons</h2>
              <button
                onClick={() => {
                  setShowAllHackathons(false);
                  setHackathonSearchQuery('');
                }}
                className="text-[#64748b] hover:text-[#0f172a] text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search hackathons by name..."
                value={hackathonSearchQuery}
                onChange={(e) => setHackathonSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
              />
            </div>
            
            {dashboard?.allHackathons && dashboard.allHackathons.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboard.allHackathons
                  .filter((hackathon: any) => 
                    !hackathonSearchQuery || 
                    hackathon.name.toLowerCase().includes(hackathonSearchQuery.toLowerCase()) ||
                    (hackathon.description && hackathon.description.toLowerCase().includes(hackathonSearchQuery.toLowerCase()))
                  )
                  .map((hackathon: any) => (
                    <Link
                      key={hackathon.hackathon_id}
                      href={`/admin/hackathons/${hackathon.hackathon_id}`}
                      className="block border border-[#e2e8f0] rounded-lg p-4 hover:bg-[#f8fafc] transition-colors"
                    >
                      <div className="font-medium text-[#0f172a] mb-2">{hackathon.name}</div>
                      {hackathon.description && (
                        <div className="text-sm text-[#64748b] mb-2 line-clamp-2">{hackathon.description}</div>
                      )}
                      {(hackathon.start_date || hackathon.end_date) && (
                        <div className="text-xs text-[#64748b]">
                          {hackathon.start_date && new Date(hackathon.start_date).toLocaleDateString()}
                          {hackathon.start_date && hackathon.end_date && ' - '}
                          {hackathon.end_date && new Date(hackathon.end_date).toLocaleDateString()}
                        </div>
                      )}
                      <div className="text-xs text-[#0891b2] mt-2">Click to manage</div>
                    </Link>
                  ))}
              </div>
            ) : (
              <p className="text-[#64748b] text-center py-8">
                {hackathonSearchQuery 
                  ? 'No hackathons match your search' 
                  : 'No hackathons found'}
              </p>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowAllHackathons(false);
                  setHackathonSearchQuery('');
                }}
                className="px-4 py-2 text-[#64748b] hover:text-[#0f172a]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Polls Modal */}
      {showAllPolls && (
        <div className="fixed inset-0 bg-[#f8fafc] bg-opacity-60 backdrop-blur-md flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 my-8 border border-[#e2e8f0]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-[#0f172a]">All Polls</h2>
              <button
                onClick={() => {
                  setShowAllPolls(false);
                  setPollSearchQuery('');
                  setPollFilter('all');
                }}
                className="text-[#64748b] hover:text-[#0f172a] text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Search and Filter */}
            <div className="mb-4 space-y-3">
              <input
                type="text"
                placeholder="Search polls by name..."
                value={pollSearchQuery}
                onChange={(e) => setPollSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
              />
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setPollFilter('all')}
                  className={`px-4 py-1 rounded-lg text-sm font-semibold transition-colors ${
                    pollFilter === 'all'
                      ? 'bg-[#1e40af] text-white'
                      : 'bg-[#f8fafc] text-[#64748b] hover:bg-[#e2e8f0]'
                  }`}
                >
                  All ({dashboard?.allPolls?.length || 0})
                </button>
                <button
                  onClick={() => setPollFilter('active')}
                  className={`px-4 py-1 rounded-lg text-sm font-semibold transition-colors ${
                    pollFilter === 'active'
                      ? 'bg-[#0891b2] text-white'
                      : 'bg-[#f8fafc] text-[#64748b] hover:bg-[#e2e8f0]'
                  }`}
                >
                  Active ({dashboard?.stats?.activePolls || 0})
                </button>
                <button
                  onClick={() => setPollFilter('ended')}
                  className={`px-4 py-1 rounded-lg text-sm font-semibold transition-colors ${
                    pollFilter === 'ended'
                      ? 'bg-[#dc2626] text-white'
                      : 'bg-[#f8fafc] text-[#64748b] hover:bg-[#e2e8f0]'
                  }`}
                >
                  Ended ({dashboard?.stats?.endedPolls || 0})
                </button>
                <button
                  onClick={() => setPollFilter('upcoming')}
                  className={`px-4 py-1 rounded-lg text-sm font-semibold transition-colors ${
                    pollFilter === 'upcoming'
                      ? 'bg-[#f59e0b] text-white'
                      : 'bg-[#f8fafc] text-[#64748b] hover:bg-[#e2e8f0]'
                  }`}
                >
                  Upcoming ({dashboard?.stats?.upcomingPolls || 0})
                </button>
              </div>
            </div>
            
            {dashboard?.allPolls && dashboard.allPolls.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboard.allPolls
                  .filter((poll: any) => {
                    // Filter by status
                    const now = new Date();
                    const startTime = new Date(poll.start_time);
                    const endTime = new Date(poll.end_time);
                    let matchesFilter = true;
                    
                    if (pollFilter === 'active') {
                      matchesFilter = startTime <= now && endTime >= now;
                    } else if (pollFilter === 'ended') {
                      matchesFilter = endTime < now;
                    } else if (pollFilter === 'upcoming') {
                      matchesFilter = startTime > now;
                    }
                    
                    // Filter by search query
                    const matchesSearch = !pollSearchQuery || 
                      poll.name.toLowerCase().includes(pollSearchQuery.toLowerCase());
                    
                    return matchesFilter && matchesSearch;
                  })
                  .map((poll: any) => (
                    <Link
                      key={poll.poll_id}
                      href={`/admin/polls/${poll.poll_id}`}
                      className="block border border-[#e2e8f0] rounded-lg p-4 hover:bg-[#f8fafc] transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-[#0f172a]">
                            {poll.name}
                            {poll.is_tie_breaker && (
                              <span className="ml-2 text-xs bg-[#fef3c7] text-[#92400e] px-2 py-0.5 rounded">Tie-Breaker</span>
                            )}
                          </div>
                          <div className="text-sm text-[#64748b] mt-1">
                            {new Date(poll.start_time).toLocaleDateString()} - {new Date(poll.end_time).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-[#64748b] mt-1">
                            Mode: {poll.voting_mode || 'single'} • {
                              poll.voting_permissions === 'voters_only' ? 'Voters Only' :
                              poll.voting_permissions === 'judges_only' ? 'Judges Only' :
                              'Voters & Judges'
                            }
                          </div>
                        </div>
                        <div className="ml-4">
                          {(() => {
                            const now = new Date();
                            const startTime = new Date(poll.start_time);
                            const endTime = new Date(poll.end_time);
                            if (startTime <= now && endTime >= now) {
                              return <span className="text-xs bg-[#0891b2] text-white px-2 py-1 rounded">Active</span>;
                            } else if (endTime < now) {
                              return <span className="text-xs bg-[#dc2626] text-white px-2 py-1 rounded">Ended</span>;
                            } else {
                              return <span className="text-xs bg-[#f59e0b] text-white px-2 py-1 rounded">Upcoming</span>;
                            }
                          })()}
                        </div>
                      </div>
                      <div className="text-xs text-[#0891b2] mt-1">Click to manage</div>
                    </Link>
                  ))}
              </div>
            ) : (
              <p className="text-[#64748b] text-center py-8">
                {pollSearchQuery || pollFilter !== 'all' 
                  ? 'No polls match your filters' 
                  : 'No polls found'}
              </p>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowAllPolls(false);
                  setPollSearchQuery('');
                  setPollFilter('all');
                }}
                className="px-4 py-2 text-[#64748b] hover:text-[#0f172a]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

