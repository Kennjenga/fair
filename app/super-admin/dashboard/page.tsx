'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layouts';
import { LoadingSpinner } from '@/components/ui';

const sidebarItems = [
  { label: 'Dashboard', href: '/super-admin/dashboard', icon: '📊' },
  { label: 'Manage Admins', href: '/super-admin/admins', icon: '👥' },
  { label: 'Audit Logs', href: '/super-admin/audit-logs', icon: '📋' },
];

/**
 * Super admin dashboard page
 */
export default function SuperAdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAllPolls, setShowAllPolls] = useState(false);
  const [showPollDetails, setShowPollDetails] = useState(false);
  const [showAllHackathons, setShowAllHackathons] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<any>(null);
  const [pollDetails, setPollDetails] = useState<any>(null);
  const [loadingPollDetails, setLoadingPollDetails] = useState(false);
  const [pollSearchQuery, setPollSearchQuery] = useState('');
  const [pollFilter, setPollFilter] = useState<'all' | 'active' | 'ended' | 'upcoming'>('all');
  const [hackathonSearchQuery, setHackathonSearchQuery] = useState('');

  useEffect(() => {
    // Check authentication
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
    fetchDashboard(token);
  }, [router]);

  const fetchDashboard = async (token: string) => {
    try {
      const response = await fetch('/api/v1/super-admin/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin');
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        console.error('Failed to fetch dashboard:', response.status, response.statusText);
        // Set default stats if API fails
        setDashboard({
          stats: {
            totalPolls: 0,
            totalHackathons: 0,
            totalAdmins: 0,
            totalVotes: 0,
            totalTokens: 0,
            activePolls: 0,
            endedPolls: 0,
            upcomingPolls: 0,
            usedTokens: 0,
            totalTeams: 0,
            totalJudges: 0,
          },
          recentPolls: [],
          recentHackathons: [],
          allPolls: [],
          allHackathons: [],
          recentActivity: [],
        });
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Dashboard data:', data); // Debug log

      // Ensure stats object exists with defaults
      if (!data.stats) {
        data.stats = {
          totalPolls: 0,
          totalHackathons: 0,
          totalAdmins: 0,
          totalVotes: 0,
          totalTokens: 0,
          activePolls: 0,
          endedPolls: 0,
          upcomingPolls: 0,
          usedTokens: 0,
          totalTeams: 0,
          totalJudges: 0,
        };
      }

      setDashboard(data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      // Set default stats on error
      setDashboard({
        stats: {
          totalPolls: 0,
          totalHackathons: 0,
          totalAdmins: 0,
          totalVotes: 0,
          totalTokens: 0,
          activePolls: 0,
          endedPolls: 0,
          upcomingPolls: 0,
          usedTokens: 0,
          totalTeams: 0,
          totalJudges: 0,
        },
        recentPolls: [],
        recentHackathons: [],
        allPolls: [],
        allHackathons: [],
        recentActivity: [],
      });
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
        <LoadingSpinner size="lg" message="Loading dashboard..." />
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
            <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Super Admin Dashboard</h1>
            <p className="text-[#64748B]">
              Monitor and manage the entire platform
              {admin && (
                <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 text-[#4F46E5]">
                  Super Admin
                </span>
              )}
            </p>
          </div>

          {/* Statistics - Grouped Sections */}
          <div className="space-y-6 mb-8">
            {/* Group 1: Overview */}
            <div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                <span>📊</span> Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-[#059669]">
                  <div className="text-3xl font-bold text-[#059669]">{dashboard?.stats?.totalVotes || 0}</div>
                  <div className="text-sm text-[#64748b] mt-1">Total Votes</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-[#d97706]">
                  <div className="text-3xl font-bold text-[#d97706]">{dashboard?.stats?.totalAdmins || 0}</div>
                  <div className="text-sm text-[#64748b] mt-1">Admins</div>
                </div>
              </div>
            </div>

            {/* Group 2: Poll Status */}
            <div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                <span>🗳️</span> Poll Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>
            </div>

            {/* Group 3: Additional Metrics */}
            <div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                <span>📈</span> Additional Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </div>
          </div>

          {/* Recent Hackathons */}
          {dashboard?.recentHackathons && dashboard.recentHackathons.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Recent Hackathons</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {dashboard.recentHackathons.map((hackathon: any) => (
                  <Link
                    key={hackathon.hackathonId}
                    href={`/admin/hackathons/${hackathon.hackathonId}`}
                    className="border border-[#e2e8f0] rounded-lg p-4 hover:bg-[#f8fafc] transition-colors"
                  >
                    <div className="font-medium text-[#0f172a] mb-2">{hackathon.name}</div>
                    {hackathon.description && (
                      <div className="text-sm text-[#64748b] mb-2 line-clamp-2">{hackathon.description}</div>
                    )}
                    {(hackathon.startDate || hackathon.endDate) && (
                      <div className="text-xs text-[#64748b]">
                        {hackathon.startDate && new Date(hackathon.startDate).toLocaleDateString()}
                        {hackathon.startDate && hackathon.endDate && ' - '}
                        {hackathon.endDate && new Date(hackathon.endDate).toLocaleDateString()}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* Recent Polls */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Recent Polls</h2>
              {dashboard?.recentPolls && dashboard.recentPolls.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.recentPolls.map((poll: any) => (
                    <div
                      key={poll.pollId}
                      className="border-b border-[#e2e8f0] pb-3 last:border-0 cursor-pointer hover:bg-[#f8fafc] p-2 rounded transition-colors"
                      onClick={async () => {
                        setSelectedPoll(poll);
                        setLoadingPollDetails(true);
                        setShowPollDetails(true);

                        const token = localStorage.getItem('auth_token');
                        if (!token) return;

                        try {
                          // Fetch comprehensive poll details
                          const [pollRes, teamsRes, tokensRes, resultsRes] = await Promise.all([
                            fetch(`/api/v1/admin/polls/${poll.pollId}`, {
                              headers: { Authorization: `Bearer ${token}` },
                            }),
                            fetch(`/api/v1/admin/polls/${poll.pollId}/teams`, {
                              headers: { Authorization: `Bearer ${token}` },
                            }),
                            fetch(`/api/v1/admin/polls/${poll.pollId}/voters`, {
                              headers: { Authorization: `Bearer ${token}` },
                            }),
                            fetch(`/api/v1/results/${poll.pollId}`, {
                              headers: { Authorization: `Bearer ${token}` },
                            }).catch(() => null), // Results might not be available
                          ]);

                          const pollData = await pollRes.json();
                          const teamsData = await teamsRes.json();
                          const tokensData = await tokensRes.json();
                          let resultsData = null;

                          if (resultsRes && resultsRes.ok) {
                            resultsData = await resultsRes.json();
                          }

                          setPollDetails({
                            poll: pollData.poll,
                            teams: teamsData.teams || [],
                            tokens: tokensData.tokens || [],
                            results: resultsData?.results || null,
                          });
                        } catch (error) {
                          console.error('Failed to fetch poll details:', error);
                        } finally {
                          setLoadingPollDetails(false);
                        }
                      }}
                    >
                      <div className="font-medium text-[#0f172a]">{poll.name}</div>
                      <div className="text-sm text-[#64748b]">
                        {new Date(poll.startTime).toLocaleDateString()} - {new Date(poll.endTime).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-[#64748b] mt-1">
                        Mode: {poll.votingMode} • {
                          poll.votingPermissions === 'voters_only' ? 'Voters Only' :
                            poll.votingPermissions === 'judges_only' ? 'Judges Only' :
                              'Voters & Judges'
                        }
                      </div>
                      <div className="text-xs text-[#0891b2] mt-1">Click to view details</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#64748b]">No polls yet</p>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Recent Activity</h2>
              {dashboard?.recentActivity && dashboard.recentActivity.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {dashboard.recentActivity.map((activity: any) => (
                    <div key={activity.logId} className="text-sm border-b border-[#e2e8f0] pb-2 last:border-0">
                      <div className="font-medium text-[#0f172a]">{activity.action}</div>
                      <div className="text-[#64748b]">
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#64748b]">No recent activity</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Quick Actions</h2>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/super-admin/admins"
                className="bg-[#1e40af] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#1e3a8a] transition-colors"
              >
                Manage Admins
              </Link>
              <Link
                href="/super-admin/audit-logs"
                className="bg-[#0891b2] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#0e7490] transition-colors"
              >
                View Audit Logs
              </Link>
            </div>
          </div>
        </div>

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
                    className={`px-4 py-1 rounded-lg text-sm font-semibold transition-colors ${pollFilter === 'all'
                      ? 'bg-[#1e40af] text-white'
                      : 'bg-[#f8fafc] text-[#64748b] hover:bg-[#e2e8f0]'
                      }`}
                  >
                    All ({dashboard?.allPolls?.length || 0})
                  </button>
                  <button
                    onClick={() => setPollFilter('active')}
                    className={`px-4 py-1 rounded-lg text-sm font-semibold transition-colors ${pollFilter === 'active'
                      ? 'bg-[#0891b2] text-white'
                      : 'bg-[#f8fafc] text-[#64748b] hover:bg-[#e2e8f0]'
                      }`}
                  >
                    Active ({dashboard?.stats?.activePolls || 0})
                  </button>
                  <button
                    onClick={() => setPollFilter('ended')}
                    className={`px-4 py-1 rounded-lg text-sm font-semibold transition-colors ${pollFilter === 'ended'
                      ? 'bg-[#dc2626] text-white'
                      : 'bg-[#f8fafc] text-[#64748b] hover:bg-[#e2e8f0]'
                      }`}
                  >
                    Ended ({dashboard?.stats?.endedPolls || 0})
                  </button>
                  <button
                    onClick={() => setPollFilter('upcoming')}
                    className={`px-4 py-1 rounded-lg text-sm font-semibold transition-colors ${pollFilter === 'upcoming'
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
                      <div
                        key={poll.poll_id}
                        className="border border-[#e2e8f0] rounded-lg p-4 cursor-pointer hover:bg-[#f8fafc] transition-colors"
                        onClick={async () => {
                          setShowAllPolls(false);
                          setSelectedPoll(poll);
                          setLoadingPollDetails(true);
                          setShowPollDetails(true);

                          const token = localStorage.getItem('auth_token');
                          if (!token) return;

                          try {
                            const [pollRes, teamsRes, tokensRes, resultsRes] = await Promise.all([
                              fetch(`/api/v1/admin/polls/${poll.poll_id}`, {
                                headers: { Authorization: `Bearer ${token}` },
                              }),
                              fetch(`/api/v1/admin/polls/${poll.poll_id}/teams`, {
                                headers: { Authorization: `Bearer ${token}` },
                              }),
                              fetch(`/api/v1/admin/polls/${poll.poll_id}/voters`, {
                                headers: { Authorization: `Bearer ${token}` },
                              }),
                              fetch(`/api/v1/results/${poll.poll_id}`, {
                                headers: { Authorization: `Bearer ${token}` },
                              }).catch(() => null),
                            ]);

                            const pollData = await pollRes.json();
                            const teamsData = await teamsRes.json();
                            const tokensData = await tokensRes.json();
                            let resultsData = null;

                            if (resultsRes && resultsRes.ok) {
                              resultsData = await resultsRes.json();
                            }

                            setPollDetails({
                              poll: pollData.poll,
                              teams: teamsData.teams || [],
                              tokens: tokensData.tokens || [],
                              results: resultsData?.results || null,
                            });
                          } catch (error) {
                            console.error('Failed to fetch poll details:', error);
                          } finally {
                            setLoadingPollDetails(false);
                          }
                        }}
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
                        <div className="text-xs text-[#0891b2] mt-1">Click to view details</div>
                      </div>
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

        {/* Poll Details Modal */}
        {showPollDetails && selectedPoll && (
          <div className="fixed inset-0 bg-[#f8fafc] bg-opacity-60 backdrop-blur-md flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 my-8 border border-[#e2e8f0]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-[#0f172a]">
                  {pollDetails?.poll?.name || selectedPoll.name}
                </h2>
                <button
                  onClick={() => {
                    setShowPollDetails(false);
                    setSelectedPoll(null);
                    setPollDetails(null);
                  }}
                  className="text-[#64748b] hover:text-[#0f172a] text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {loadingPollDetails ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="md" message="Loading poll details..." />
                </div>
              ) : pollDetails ? (
                <div className="space-y-6">
                  {/* Poll Information */}
                  <div className="border-b border-[#e2e8f0] pb-4">
                    <h3 className="text-lg font-semibold text-[#0f172a] mb-3">Poll Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-[#64748b]">Start Time:</span>
                        <div className="text-[#0f172a]">
                          {new Date(pollDetails.poll.start_time).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-[#64748b]">End Time:</span>
                        <div className="text-[#0f172a]">
                          {new Date(pollDetails.poll.end_time).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-[#64748b]">Status:</span>
                        <div className="text-[#0f172a]">
                          {new Date() >= new Date(pollDetails.poll.start_time) && new Date() <= new Date(pollDetails.poll.end_time)
                            ? 'Active'
                            : new Date() < new Date(pollDetails.poll.start_time)
                              ? 'Upcoming'
                              : 'Ended'}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-[#64748b]">Results Public:</span>
                        <div className="text-[#0f172a]">
                          {pollDetails.poll.is_public_results ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-[#64748b]">Allow Self Vote:</span>
                        <div className="text-[#0f172a]">
                          {pollDetails.poll.allow_self_vote ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-[#64748b]">Require Team Name Gate:</span>
                        <div className="text-[#0f172a]">
                          {pollDetails.poll.require_team_name_gate ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-[#64748b]">Voting Mode:</span>
                        <div className="text-[#0f172a] capitalize">
                          {pollDetails.poll.voting_mode || 'single'}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-[#64748b]">Voting Permissions:</span>
                        <div className="text-[#0f172a]">
                          {
                            pollDetails.poll.voting_permissions === 'voters_only' ? 'Voters Only' :
                              pollDetails.poll.voting_permissions === 'judges_only' ? 'Judges Only' :
                                'Voters & Judges'
                          }
                        </div>
                      </div>
                      {pollDetails.poll.voting_mode === 'ranked' && (
                        <div>
                          <span className="font-medium text-[#64748b]">Rank Points Config:</span>
                          <div className="text-[#0f172a] text-xs">
                            {JSON.stringify(pollDetails.poll.rank_points_config || {})}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#f8fafc] rounded-lg p-4">
                      <div className="text-2xl font-bold text-[#1e40af]">{pollDetails.teams.length}</div>
                      <div className="text-sm text-[#64748b] mt-1">Teams</div>
                    </div>
                    <div className="bg-[#f8fafc] rounded-lg p-4">
                      <div className="text-2xl font-bold text-[#0891b2]">{pollDetails.tokens.length}</div>
                      <div className="text-sm text-[#64748b] mt-1">Registered Voters</div>
                    </div>
                    <div className="bg-[#f8fafc] rounded-lg p-4">
                      <div className="text-2xl font-bold text-[#059669]">
                        {pollDetails.results?.totalVotes || pollDetails.tokens.filter((t: any) => t.used).length}
                      </div>
                      <div className="text-sm text-[#64748b] mt-1">Total Votes</div>
                    </div>
                  </div>

                  {/* Teams */}
                  {pollDetails.teams.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-[#0f172a] mb-3">Teams ({pollDetails.teams.length})</h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {pollDetails.teams.map((team: any) => {
                          // Tokens API returns teamId (camelCase), teams have team_id
                          const teamVoters = pollDetails.tokens.filter((t: any) =>
                            (t.teamId || t.team_id) === team.team_id
                          );
                          // Get vote count from results.teams array (new structure)
                          const teamResult = pollDetails.results?.teams?.find((r: any) =>
                            r.teamId === team.team_id || r.team_id === team.team_id
                          );
                          // Calculate vote count: use voteCount if available, otherwise sum voterVotes and judgeVotes
                          let teamVotes = 0;
                          if (teamResult) {
                            if (teamResult.voteCount !== undefined) {
                              teamVotes = typeof teamResult.voteCount === 'number' ? teamResult.voteCount : parseInt(teamResult.voteCount || 0, 10);
                            } else {
                              const voterVotes = typeof teamResult.voterVotes === 'number' ? teamResult.voterVotes : parseInt(teamResult.voterVotes || 0, 10);
                              const judgeVotes = typeof teamResult.judgeVotes === 'number' ? teamResult.judgeVotes : parseInt(teamResult.judgeVotes || 0, 10);
                              teamVotes = voterVotes + judgeVotes;
                            }
                          }
                          return (
                            <div key={team.team_id} className="border border-[#e2e8f0] rounded-lg p-3 flex justify-between items-center">
                              <div>
                                <div className="font-medium text-[#0f172a]">{team.team_name}</div>
                                <div className="text-sm text-[#64748b]">
                                  {teamVoters.length} member(s) • {teamVotes} vote(s)
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Results */}
                  {pollDetails.results && (
                    <div>
                      <h3 className="text-lg font-semibold text-[#0f172a] mb-3">Vote Results</h3>
                      <div className="mb-3 text-sm text-[#64748b]">
                        Total: {pollDetails.results.totalVotes || 0} votes ({pollDetails.results.voterVotes || 0} voter, {pollDetails.results.judgeVotes || 0} judge)
                      </div>
                      <div className="space-y-2">
                        {pollDetails.results.teams?.map((result: any) => {
                          const team = pollDetails.teams.find((t: any) => t.team_id === result.teamId);
                          const totalScore = typeof result.totalScore === 'number' ? result.totalScore : parseFloat(result.totalScore || 0);
                          const voterScore = typeof result.voterScore === 'number' ? result.voterScore : parseFloat(result.voterScore || 0);
                          const judgeScore = typeof result.judgeScore === 'number' ? result.judgeScore : parseFloat(result.judgeScore || 0);
                          const maxScore = Math.max(...(pollDetails.results.teams || []).map((r: any) => {
                            const score = typeof r.totalScore === 'number' ? r.totalScore : parseFloat(r.totalScore || 0);
                            return score;
                          }), 1);
                          const percentage = maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(1) : '0';
                          return (
                            <div key={result.teamId} className="border border-[#e2e8f0] rounded-lg p-3">
                              <div className="flex justify-between items-center mb-2">
                                <div className="font-medium text-[#0f172a]">{result.teamName || team?.team_name || 'Unknown Team'}</div>
                                <div className="text-sm text-[#64748b]">
                                  Score: {totalScore.toFixed(2)}
                                  {(voterScore > 0 || judgeScore > 0) && (
                                    <span className="ml-2 text-xs">
                                      (V: {voterScore.toFixed(2)}, J: {judgeScore.toFixed(2)})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="w-full bg-[#e2e8f0] rounded-full h-2">
                                <div
                                  className="bg-[#059669] h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(100, parseFloat(percentage))}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 justify-end pt-4 border-t border-[#e2e8f0]">
                    <Link
                      href={`/admin/polls/${pollDetails.poll.poll_id}`}
                      className="px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors"
                    >
                      Manage Poll
                    </Link>
                    {pollDetails.results && (
                      <Link
                        href={`/results/${pollDetails.poll.poll_id}`}
                        className="px-4 py-2 bg-[#059669] text-white rounded-lg hover:bg-[#047857] transition-colors"
                      >
                        View Results
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[#64748b]">Failed to load poll details</div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowPollDetails(false);
                    setSelectedPoll(null);
                    setPollDetails(null);
                  }}
                  className="px-4 py-2 text-[#64748b] hover:text-[#0f172a]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

