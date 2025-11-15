'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Super admin dashboard page
 */
export default function SuperAdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAllPolls, setShowAllPolls] = useState(false);
  const [showPollDetails, setShowPollDetails] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<any>(null);
  const [pollDetails, setPollDetails] = useState<any>(null);
  const [loadingPollDetails, setLoadingPollDetails] = useState(false);

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

      const data = await response.json();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
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
          <h1 className="text-2xl font-bold text-[#1e40af]">FAIR Super Admin Dashboard</h1>
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
        {/* Statistics */}
        {dashboard?.stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div 
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={async () => {
                setShowAllPolls(true);
                // Fetch all polls if not already loaded
                if (!dashboard.allPolls) {
                  const token = localStorage.getItem('auth_token');
                  if (token) {
                    try {
                      const response = await fetch('/api/v1/admin/polls', {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      const data = await response.json();
                      setDashboard({ ...dashboard, allPolls: data.polls || [] });
                    } catch (error) {
                      console.error('Failed to fetch all polls:', error);
                    }
                  }
                }
              }}
            >
              <div className="text-3xl font-bold text-[#1e40af]">{dashboard.stats.totalPolls}</div>
              <div className="text-sm text-[#64748b] mt-1">Total Polls</div>
              <div className="text-xs text-[#0891b2] mt-2">Click to view all</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-[#0891b2]">{dashboard.stats.activePolls}</div>
              <div className="text-sm text-[#64748b] mt-1">Active Polls</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-[#059669]">{dashboard.stats.totalVotes}</div>
              <div className="text-sm text-[#64748b] mt-1">Total Votes</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-[#475569]">{dashboard.stats.totalTokens}</div>
              <div className="text-sm text-[#64748b] mt-1">Total Tokens</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-[#d97706]">{dashboard.stats.totalAdmins}</div>
              <div className="text-sm text-[#64748b] mt-1">Admins</div>
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
                onClick={() => setShowAllPolls(false)}
                className="text-[#64748b] hover:text-[#0f172a] text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            {dashboard?.allPolls && dashboard.allPolls.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboard.allPolls.map((poll: any) => (
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
                    <div className="font-medium text-[#0f172a]">{poll.name}</div>
                    <div className="text-sm text-[#64748b] mt-1">
                      {new Date(poll.start_time).toLocaleDateString()} - {new Date(poll.end_time).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-[#0891b2] mt-1">Click to view details</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#64748b] text-center py-8">No polls found</p>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAllPolls(false)}
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
              <div className="text-center py-8 text-[#64748b]">Loading poll details...</div>
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
                        const teamVoters = pollDetails.tokens.filter((t: any) => t.team_id === team.team_id);
                        const teamVotes = pollDetails.results?.voteCounts?.find((vc: any) => vc.teamId === team.team_id)?.voteCount || 0;
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
                    <div className="space-y-2">
                      {pollDetails.results.voteCounts?.map((vc: any) => {
                        const team = pollDetails.teams.find((t: any) => t.team_id === vc.teamId);
                        const percentage = pollDetails.results.totalVotes > 0 
                          ? ((vc.voteCount / pollDetails.results.totalVotes) * 100).toFixed(1)
                          : '0';
                        return (
                          <div key={vc.teamId} className="border border-[#e2e8f0] rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <div className="font-medium text-[#0f172a]">{team?.team_name || 'Unknown Team'}</div>
                              <div className="text-sm text-[#64748b]">
                                {vc.voteCount} vote(s) ({percentage}%)
                              </div>
                            </div>
                            <div className="w-full bg-[#e2e8f0] rounded-full h-2">
                              <div 
                                className="bg-[#059669] h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
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
    </div>
  );
}

