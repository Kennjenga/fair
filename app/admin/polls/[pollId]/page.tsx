'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Poll management page
 */
export default function PollManagementPage() {
  const router = useRouter();
  const params = useParams();
  const pollId = params?.pollId as string;
  
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [poll, setPoll] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [judges, setJudges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Judge management states
  const [showAddJudge, setShowAddJudge] = useState(false);
  const [judgeEmail, setJudgeEmail] = useState('');
  const [judgeName, setJudgeName] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'voters' | 'judges' | 'results'>('overview');
  
  // Modal states
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showRegisterVoters, setShowRegisterVoters] = useState(false);
  const [showRegisterSelf, setShowRegisterSelf] = useState(false);
  const [showEditTimeline, setShowEditTimeline] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [showReassignVoter, setShowReassignVoter] = useState(false);
  const [showTeamMembers, setShowTeamMembers] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [reassigningVoter, setReassigningVoter] = useState<any>(null);
  const [viewingTeam, setViewingTeam] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  // Form states
  const [teamName, setTeamName] = useState('');
  const [editTeamName, setEditTeamName] = useState('');
  const [votersList, setVotersList] = useState([{ email: '', teamName: '' }]);
  const [selectedTeamForSelf, setSelectedTeamForSelf] = useState('');
  const [selectedReassignTeam, setSelectedReassignTeam] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Searchable dropdown states for team selection
  const [teamSearchOpen, setTeamSearchOpen] = useState<{ [key: number]: boolean }>({});
  const [teamSearchQuery, setTeamSearchQuery] = useState<{ [key: number]: string }>({});
  const [reassignTeamSearchOpen, setReassignTeamSearchOpen] = useState(false);
  const [reassignTeamSearchQuery, setReassignTeamSearchQuery] = useState('');

  useEffect(() => {
    if (!pollId) return;
    
    const token = localStorage.getItem('auth_token');
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }

    const parsed = JSON.parse(adminData);
    setAdmin(parsed);
    fetchPollData(token);
  }, [pollId, router]);

  const fetchPollData = async (token: string) => {
    if (!pollId) return;
    
    try {
      const [pollRes, teamsRes, tokensRes, judgesRes] = await Promise.all([
        fetch(`/api/v1/admin/polls/${pollId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/v1/admin/polls/${pollId}/teams`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/v1/admin/polls/${pollId}/voters`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/v1/admin/polls/${pollId}/judges`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (pollRes.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin');
        router.push('/admin/login');
        return;
      }

      const pollData = await pollRes.json();
      const teamsData = await teamsRes.json();
      const tokensData = await tokensRes.json();
      const judgesData = await judgesRes.json();

      setPoll(pollData.poll);
      setTeams(teamsData.teams || []);
      setTokens(tokensData.tokens || []);
      setJudges(judgesData.judges || []);
      
      // Set timeline for editing
      if (pollData.poll) {
        const start = new Date(pollData.poll.start_time);
        const end = new Date(pollData.poll.end_time);
        setStartTime(start.toISOString().slice(0, 16));
        setEndTime(end.toISOString().slice(0, 16));
      }
    } catch (error) {
      console.error('Failed to fetch poll data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async () => {
    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/v1/admin/polls/${pollId}/teams`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamName: teamName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to add team');
        return;
      }

      setSuccess('Team added successfully!');
      setTeamName('');
      setShowAddTeam(false);
      // Refresh teams list
      const token2 = localStorage.getItem('auth_token');
      if (token2) {
        const teamsRes = await fetch(`/api/v1/admin/polls/${pollId}/teams`, {
          headers: { Authorization: `Bearer ${token2}` },
        });
        const teamsData = await teamsRes.json();
        setTeams(teamsData.teams || []);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterVoters = async () => {
    // Validate voters list
    const validVoters = votersList.filter(v => v.email.trim() && v.teamName.trim());
    if (validVoters.length === 0) {
      setError('Please add at least one voter with email and team name');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/v1/admin/polls/${pollId}/voters`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voters: validVoters }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to register voters');
        return;
      }

      setSuccess(`${validVoters.length} voter(s) registered successfully!`);
      setVotersList([{ email: '', teamName: '' }]);
      setTeamSearchQuery({});
      setTeamSearchOpen({});
      setShowRegisterVoters(false);
      // Refresh tokens list
      const token2 = localStorage.getItem('auth_token');
      if (token2) {
        const tokensRes = await fetch(`/api/v1/admin/polls/${pollId}/voters`, {
          headers: { Authorization: `Bearer ${token2}` },
        });
        const tokensData = await tokensRes.json();
        setTokens(tokensData.tokens || []);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSelf = async () => {
    if (!selectedTeamForSelf) {
      setError('Please select a team');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/v1/admin/polls/${pollId}/register-self`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamName: selectedTeamForSelf }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to register as voter');
        return;
      }

      setSuccess('Successfully registered as voter!');
      setSelectedTeamForSelf('');
      setShowRegisterSelf(false);
      // Refresh tokens list
      const token2 = localStorage.getItem('auth_token');
      if (token2) {
        const tokensRes = await fetch(`/api/v1/admin/polls/${pollId}/voters`, {
          headers: { Authorization: `Bearer ${token2}` },
        });
        const tokensData = await tokensRes.json();
        setTokens(tokensData.tokens || []);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTimeline = async () => {
    if (!startTime || !endTime) {
      setError('Start time and end time are required');
      return;
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setError('Invalid date format');
      return;
    }

    if (endDate <= startDate) {
      setError('End time must be after start time');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/v1/admin/polls/${pollId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update timeline');
        return;
      }

      setSuccess('Timeline updated successfully!');
      setShowEditTimeline(false);
      // Refresh poll data
      const token2 = localStorage.getItem('auth_token');
      if (token2) {
        await fetchPollData(token2);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const addVoterRow = () => {
    setVotersList([...votersList, { email: '', teamName: '' }]);
  };

  const removeVoterRow = (index: number) => {
    setVotersList(votersList.filter((_, i) => i !== index));
  };

  const updateVoterRow = (index: number, field: 'email' | 'teamName', value: string) => {
    const updated = [...votersList];
    updated[index][field] = value;
    setVotersList(updated);
    // Update search query when team name is set
    if (field === 'teamName') {
      setTeamSearchQuery({ ...teamSearchQuery, [index]: value });
    }
  };
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.team-search-dropdown')) {
        setTeamSearchOpen({});
        setReassignTeamSearchOpen(false);
      }
    };
    
    const hasOpenDropdown = Object.values(teamSearchOpen).some(open => open) || reassignTeamSearchOpen;
    
    if (hasOpenDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    
    // Return empty cleanup function if no dropdowns are open
    return () => {};
  }, [teamSearchOpen, reassignTeamSearchOpen]);

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

  if (!poll) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#dc2626] mb-4">Poll Not Found</h2>
          <Link href="/admin/dashboard" className="text-[#0891b2] hover:text-[#0e7490]">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b border-[#e2e8f0]">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin/dashboard" className="text-2xl font-bold text-[#1e40af]">
            FAIR Admin Dashboard
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
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-[#0f172a] mb-2">{poll.name}</h1>
            <p className="text-[#64748b]">
              {new Date(poll.start_time).toLocaleString()} - {new Date(poll.end_time).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => setShowEditTimeline(true)}
            className="bg-[#0891b2] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0e7490] transition-colors"
          >
            Adjust Timeline
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#e2e8f0] mb-6">
          <nav className="flex gap-4">
            {(['overview', 'teams', 'voters', 'judges', 'results'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-[#1e40af] text-[#1e40af]'
                    : 'border-transparent text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Poll Overview</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-[#0f172a]">Status: </span>
                <span className={`px-2 py-1 rounded text-sm ${
                  new Date() >= new Date(poll.start_time) && new Date() <= new Date(poll.end_time)
                    ? 'bg-green-100 text-green-800'
                    : new Date() < new Date(poll.start_time)
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {new Date() >= new Date(poll.start_time) && new Date() <= new Date(poll.end_time)
                    ? 'Active'
                    : new Date() < new Date(poll.start_time)
                    ? 'Upcoming'
                    : 'Ended'}
                </span>
              </div>
              <div>
                <span className="font-medium text-[#0f172a]">Teams: </span>
                <span className="text-[#64748b]">{teams.length}</span>
              </div>
              <div>
                <span className="font-medium text-[#0f172a]">Registered Voters: </span>
                <span className="text-[#64748b]">{tokens.length}</span>
              </div>
              <div>
                <span className="font-medium text-[#0f172a]">Results Public: </span>
                <span className="text-[#64748b]">{poll.is_public_results ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#0f172a]">Teams</h2>
              <button
                onClick={() => setShowAddTeam(true)}
                className="bg-[#0891b2] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0e7490] transition-colors"
              >
                Add Team
              </button>
            </div>
            {teams.length === 0 ? (
              <p className="text-[#64748b]">No teams added yet.</p>
            ) : (
              <div className="space-y-2">
                {teams.map((team) => {
                  // Fix: Check both team_id and teamId properties
                  const memberCount = tokens.filter(t => 
                    t.team_id === team.team_id || t.teamId === team.team_id
                  ).length;
                  return (
                    <div key={team.team_id} className="border border-[#e2e8f0] rounded-lg p-4 flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium text-[#0f172a]">{team.team_name}</div>
                        <div className="text-sm text-[#64748b] mt-1">
                          {memberCount} member(s)
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => {
                            router.push(`/admin/polls/${pollId}/teams/${team.team_id}`);
                          }}
                          className="p-2 text-[#059669] hover:text-[#047857] hover:bg-[#f0fdf4] rounded transition-colors"
                          title="View team details"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setEditingTeam(team);
                            setEditTeamName(team.team_name);
                            setShowEditTeam(true);
                          }}
                          className="p-2 text-[#0891b2] hover:text-[#0e7490] hover:bg-[#f0f9ff] rounded transition-colors"
                          title="Edit team"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Are you sure you want to delete "${team.team_name}"? This action cannot be undone.`)) {
                              return;
                            }
                            
                            const token = localStorage.getItem('auth_token');
                            if (!token) return;
                            
                            try {
                              const response = await fetch(`/api/v1/admin/polls/${pollId}/teams/${team.team_id}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              
                              const data = await response.json();
                              
                              if (!response.ok) {
                                setError(data.error || 'Failed to delete team');
                                return;
                              }
                              
                              setSuccess('Team deleted successfully');
                              fetchPollData(token);
                            } catch (err) {
                              setError('Failed to delete team');
                            }
                          }}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                          title="Delete team"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'voters' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#0f172a]">Voters</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRegisterVoters(true)}
                  className="bg-[#059669] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#047857] transition-colors"
                >
                  Register Voters
                </button>
                <button
                  onClick={() => setShowRegisterSelf(true)}
                  className="bg-[#0891b2] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0e7490] transition-colors"
                >
                  Register Self
                </button>
              </div>
            </div>
            {tokens.length === 0 ? (
              <p className="text-[#64748b]">No voters registered yet.</p>
            ) : (
              <div className="space-y-2">
                {tokens.map((token) => {
                  const team = teams.find(t => t.team_id === token.team_id);
                  return (
                    <div key={token.tokenId} className="border border-[#e2e8f0] rounded-lg p-4 flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium text-[#0f172a]">{token.email}</div>
                        <div className="text-sm text-[#64748b] mt-1">
                          Team: {team?.team_name || 'Unknown'} • Status: {token.deliveryStatus || 'queued'} • {token.used ? 'Voted' : 'Not Voted'}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setReassigningVoter(token);
                          setSelectedReassignTeam(token.team_id);
                          setReassignTeamSearchQuery(team?.team_name || '');
                          setShowReassignVoter(true);
                        }}
                        className="px-3 py-1 text-sm text-[#0891b2] hover:text-[#0e7490] border border-[#0891b2] rounded hover:bg-[#f0f9ff] transition-colors"
                      >
                        Reassign
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'judges' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#0f172a]">Judges</h2>
              <button
                onClick={() => {
                  setShowAddJudge(true);
                  setJudgeEmail('');
                  setJudgeName('');
                }}
                className="bg-[#1e40af] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#1e3a8a] transition-colors"
              >
                Add Judge
              </button>
            </div>

            {judges.length === 0 ? (
              <p className="text-[#64748b]">No judges added yet. Add judges to allow them to vote on this poll.</p>
            ) : (
              <div className="space-y-2">
                {judges.map((judge) => (
                  <div
                    key={judge.email}
                    className="flex justify-between items-center p-3 border border-[#e2e8f0] rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-[#0f172a]">{judge.email}</p>
                      {judge.name && (
                        <p className="text-sm text-[#64748b]">{judge.name}</p>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm(`Remove ${judge.email} as a judge?`)) return;
                        
                        const token = localStorage.getItem('auth_token');
                        if (!token) return;

                        try {
                          const response = await fetch(
                            `/api/v1/admin/polls/${pollId}/judges/${encodeURIComponent(judge.email)}`,
                            {
                              method: 'DELETE',
                              headers: { Authorization: `Bearer ${token}` },
                            }
                          );

                          if (response.ok) {
                            setJudges(judges.filter(j => j.email !== judge.email));
                            setSuccess('Judge removed successfully');
                          } else {
                            const data = await response.json();
                            setError(data.error || 'Failed to remove judge');
                          }
                        } catch (err) {
                          setError('An error occurred');
                        }
                      }}
                      className="px-3 py-1 text-sm text-[#dc2626] hover:text-[#b91c1c] border border-[#dc2626] rounded hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Judge Modal */}
            {showAddJudge && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Add Judge</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0f172a] mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={judgeEmail}
                        onChange={(e) => setJudgeEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                        placeholder="judge@example.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#0f172a] mb-1">
                        Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={judgeName}
                        onChange={(e) => setJudgeName(e.target.value)}
                        className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                        placeholder="Judge Name"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={async () => {
                        if (!judgeEmail) {
                          setError('Email is required');
                          return;
                        }

                        const token = localStorage.getItem('auth_token');
                        if (!token) return;

                        try {
                          const response = await fetch(`/api/v1/admin/polls/${pollId}/judges`, {
                            method: 'POST',
                            headers: {
                              Authorization: `Bearer ${token}`,
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              email: judgeEmail,
                              name: judgeName || undefined,
                            }),
                          });

                          const data = await response.json();

                          if (response.ok) {
                            setJudges([...judges, data.judge]);
                            setShowAddJudge(false);
                            setJudgeEmail('');
                            setJudgeName('');
                            setSuccess('Judge added successfully');
                          } else {
                            setError(data.error || 'Failed to add judge');
                          }
                        } catch (err) {
                          setError('An error occurred');
                        }
                      }}
                      className="flex-1 bg-[#1e40af] text-white py-2 rounded-lg font-semibold hover:bg-[#1e3a8a] transition-colors"
                    >
                      Add Judge
                    </button>
                    <button
                      onClick={() => {
                        setShowAddJudge(false);
                        setJudgeEmail('');
                        setJudgeName('');
                      }}
                      className="flex-1 bg-[#64748b] text-white py-2 rounded-lg font-semibold hover:bg-[#475569] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Results</h2>
            <p className="text-[#64748b] mb-4">
              {poll.is_public_results 
                ? 'Results are publicly available.' 
                : 'Results are private. Only you and super admins can view them.'}
            </p>
            <Link
              href={`/results/${pollId}`}
              className="inline-block bg-[#0891b2] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#0e7490] transition-colors"
            >
              View Results →
            </Link>
          </div>
        )}
      </div>

      {/* Add Team Modal */}
      {showAddTeam && (
        <div className="fixed inset-0 bg-[#f8fafc] bg-opacity-60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-[#e2e8f0]">
            <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Add Team</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                  placeholder="Enter team name"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowAddTeam(false);
                    setTeamName('');
                    setError('');
                  }}
                  className="px-4 py-2 text-[#64748b] hover:text-[#0f172a]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTeam}
                  disabled={submitting}
                  className="px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Team'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Voters Modal */}
      {showRegisterVoters && (
        <div className="fixed inset-0 bg-[#f8fafc] bg-opacity-60 backdrop-blur-md flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 my-8 border border-[#e2e8f0]">
            <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Register Voters</h3>
            <div className="space-y-4">
              {votersList.map((voter, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-[#0f172a] mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={voter.email}
                      onChange={(e) => updateVoterRow(index, 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                      placeholder="voter@example.com"
                    />
                  </div>
                  <div className="flex-1 relative team-search-dropdown">
                    <label className="block text-sm font-medium text-[#0f172a] mb-1">
                      Team Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={teamSearchQuery[index] !== undefined ? teamSearchQuery[index] : voter.teamName}
                        onChange={(e) => {
                          const query = e.target.value;
                          setTeamSearchQuery({ ...teamSearchQuery, [index]: query });
                          setTeamSearchOpen({ ...teamSearchOpen, [index]: true });
                          // Auto-select if exact match
                          const exactMatch = teams.find(t => t.team_name.toLowerCase() === query.toLowerCase());
                          if (exactMatch) {
                            updateVoterRow(index, 'teamName', exactMatch.team_name);
                            setTeamSearchQuery({ ...teamSearchQuery, [index]: exactMatch.team_name });
                            setTeamSearchOpen({ ...teamSearchOpen, [index]: false });
                          } else {
                            // Update the voter row with the typed value
                            updateVoterRow(index, 'teamName', query);
                          }
                        }}
                        onFocus={() => setTeamSearchOpen({ ...teamSearchOpen, [index]: true })}
                        className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                        placeholder="Search or type team name"
                      />
                      {teamSearchOpen[index] && teams.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-60 overflow-auto">
                          {teams
                            .filter(team => 
                              !teamSearchQuery[index] || 
                              team.team_name.toLowerCase().includes(teamSearchQuery[index].toLowerCase())
                            )
                            .map((team) => (
                              <button
                                key={team.team_id}
                                type="button"
                                onClick={() => {
                                  updateVoterRow(index, 'teamName', team.team_name);
                                  setTeamSearchQuery({ ...teamSearchQuery, [index]: team.team_name });
                                  setTeamSearchOpen({ ...teamSearchOpen, [index]: false });
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-[#f8fafc] focus:bg-[#f8fafc] focus:outline-none"
                              >
                                {team.team_name}
                              </button>
                            ))}
                          {teams.filter(team => 
                            !teamSearchQuery[index] || 
                            team.team_name.toLowerCase().includes(teamSearchQuery[index].toLowerCase())
                          ).length === 0 && (
                            <div className="px-4 py-2 text-[#64748b] text-sm">
                              No teams found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {teams.length === 0 && (
                      <p className="text-xs text-[#64748b] mt-1">
                        No teams available. Add teams first.
                      </p>
                    )}
                  </div>
                  {votersList.length > 1 && (
                    <button
                      onClick={() => removeVoterRow(index)}
                      className="mt-6 px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addVoterRow}
                className="text-[#0891b2] hover:text-[#0e7490] text-sm"
              >
                + Add Another Voter
              </button>
              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={() => {
                    setShowRegisterVoters(false);
                    setVotersList([{ email: '', teamName: '' }]);
                    setTeamSearchQuery({});
                    setTeamSearchOpen({});
                    setError('');
                  }}
                  className="px-4 py-2 text-[#64748b] hover:text-[#0f172a]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegisterVoters}
                  disabled={submitting}
                  className="px-4 py-2 bg-[#059669] text-white rounded-lg hover:bg-[#047857] disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register Voters'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Self Modal */}
      {showRegisterSelf && (
        <div className="fixed inset-0 bg-[#f8fafc] bg-opacity-60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-[#e2e8f0]">
            <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Register Self as Voter</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">
                  Select Team *
                </label>
                <select
                  value={selectedTeamForSelf}
                  onChange={(e) => setSelectedTeamForSelf(e.target.value)}
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                >
                  <option value="">Select a team</option>
                  {teams.map((team) => (
                    <option key={team.team_id} value={team.team_name}>
                      {team.team_name}
                    </option>
                  ))}
                </select>
                {teams.length === 0 && (
                  <p className="text-sm text-[#64748b] mt-1">
                    No teams available. Please add teams first.
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowRegisterSelf(false);
                    setSelectedTeamForSelf('');
                    setError('');
                  }}
                  className="px-4 py-2 text-[#64748b] hover:text-[#0f172a]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegisterSelf}
                  disabled={submitting || teams.length === 0}
                  className="px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register Self'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditTeam && editingTeam && (
        <div className="fixed inset-0 bg-[#f8fafc] bg-opacity-60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-[#e2e8f0]">
            <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Edit Team</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                  placeholder="Team name"
                />
              </div>
              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowEditTeam(false);
                    setEditingTeam(null);
                    setEditTeamName('');
                    setError('');
                  }}
                  className="px-4 py-2 text-[#64748b] hover:text-[#0f172a]"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!editTeamName.trim()) {
                      setError('Team name is required');
                      return;
                    }
                    
                    setSubmitting(true);
                    setError('');
                    
                    const token = localStorage.getItem('auth_token');
                    if (!token) return;
                    
                    try {
                      const response = await fetch(`/api/v1/admin/polls/${pollId}/teams/${editingTeam.team_id}`, {
                        method: 'PATCH',
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ teamName: editTeamName.trim() }),
                      });
                      
                      const data = await response.json();
                      
                      if (!response.ok) {
                        setError(data.error || 'Failed to update team');
                        setSubmitting(false);
                        return;
                      }
                      
                      setSuccess('Team updated successfully');
                      setShowEditTeam(false);
                      setEditingTeam(null);
                      setEditTeamName('');
                      fetchPollData(token);
                    } catch (err) {
                      setError('Failed to update team');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  className="px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Team'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Voter Modal */}
      {showReassignVoter && reassigningVoter && (
        <div className="fixed inset-0 bg-[#f8fafc] bg-opacity-60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-[#e2e8f0]">
            <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Reassign Voter</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#64748b] mb-2">
                  Reassign <strong>{reassigningVoter.email}</strong> to a different team
                </p>
              </div>
              <div className="relative team-search-dropdown">
                <label className="block text-sm font-medium text-[#0f172a] mb-1">
                  New Team *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={reassignTeamSearchQuery}
                    onChange={(e) => {
                      const query = e.target.value;
                      setReassignTeamSearchQuery(query);
                      setReassignTeamSearchOpen(true);
                      // Auto-select if exact match
                      const exactMatch = teams.find(t => t.team_name.toLowerCase() === query.toLowerCase());
                      if (exactMatch) {
                        setSelectedReassignTeam(exactMatch.team_id);
                        setReassignTeamSearchQuery(exactMatch.team_name);
                        setReassignTeamSearchOpen(false);
                      }
                    }}
                    onFocus={() => setReassignTeamSearchOpen(true)}
                    className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                    placeholder="Search or type team name"
                  />
                  {reassignTeamSearchOpen && teams.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-60 overflow-auto">
                      {teams
                        .filter(team => 
                          !reassignTeamSearchQuery || 
                          team.team_name.toLowerCase().includes(reassignTeamSearchQuery.toLowerCase())
                        )
                        .map((team) => (
                          <button
                            key={team.team_id}
                            type="button"
                            onClick={() => {
                              setSelectedReassignTeam(team.team_id);
                              setReassignTeamSearchQuery(team.team_name);
                              setReassignTeamSearchOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-[#f8fafc] focus:bg-[#f8fafc] focus:outline-none"
                          >
                            {team.team_name}
                          </button>
                        ))}
                      {teams.filter(team => 
                        !reassignTeamSearchQuery || 
                        team.team_name.toLowerCase().includes(reassignTeamSearchQuery.toLowerCase())
                      ).length === 0 && (
                        <div className="px-4 py-2 text-[#64748b] text-sm">
                          No teams found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {teams.length === 0 && (
                  <p className="text-xs text-[#64748b] mt-1">
                    No teams available. Add teams first.
                  </p>
                )}
              </div>
              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowReassignVoter(false);
                    setReassigningVoter(null);
                    setSelectedReassignTeam('');
                    setReassignTeamSearchQuery('');
                    setError('');
                  }}
                  className="px-4 py-2 text-[#64748b] hover:text-[#0f172a]"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!selectedReassignTeam) {
                      setError('Please select a team');
                      return;
                    }
                    
                    if (selectedReassignTeam === reassigningVoter.team_id) {
                      setError('Voter is already assigned to this team');
                      return;
                    }
                    
                    setSubmitting(true);
                    setError('');
                    
                    const token = localStorage.getItem('auth_token');
                    if (!token) return;
                    
                    try {
                      const response = await fetch(`/api/v1/admin/polls/${pollId}/voters/${reassigningVoter.tokenId}/reassign`, {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ newTeamId: selectedReassignTeam }),
                      });
                      
                      const data = await response.json();
                      
                      if (!response.ok) {
                        setError(data.error || 'Failed to reassign voter');
                        setSubmitting(false);
                        return;
                      }
                      
                      setSuccess('Voter reassigned successfully');
                      setShowReassignVoter(false);
                      setReassigningVoter(null);
                      setSelectedReassignTeam('');
                      setReassignTeamSearchQuery('');
                      fetchPollData(token);
                    } catch (err) {
                      setError('Failed to reassign voter');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting || !selectedReassignTeam}
                  className="px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] disabled:opacity-50"
                >
                  {submitting ? 'Reassigning...' : 'Reassign Voter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Members Modal */}
      {showTeamMembers && viewingTeam && (
        <div className="fixed inset-0 bg-[#f8fafc] bg-opacity-60 backdrop-blur-md flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 my-8 border border-[#e2e8f0]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-[#0f172a]">
                Team Members: {viewingTeam.team_name}
              </h3>
              <button
                onClick={() => {
                  setShowTeamMembers(false);
                  setViewingTeam(null);
                  setTeamMembers([]);
                  setError('');
                }}
                className="text-[#64748b] hover:text-[#0f172a] text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            {loadingMembers ? (
              <div className="text-center py-8 text-[#64748b]">Loading members...</div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-8 text-[#64748b]">
                No members registered for this team yet.
              </div>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((member) => {
                  const token = tokens.find(t => t.tokenId === member.tokenId);
                  return (
                    <div key={member.tokenId} className="border border-[#e2e8f0] rounded-lg p-4 flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium text-[#0f172a]">{member.email}</div>
                        <div className="text-sm text-[#64748b] mt-1">
                          Status: {token?.deliveryStatus || 'queued'} • {member.used ? 'Voted' : 'Not Voted'}
                          {member.issuedAt && (
                            <span> • Registered: {new Date(member.issuedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setReassigningVoter(token || member);
                          setSelectedReassignTeam(viewingTeam.team_id);
                          setReassignTeamSearchQuery(viewingTeam.team_name);
                          setShowReassignVoter(true);
                          setShowTeamMembers(false);
                        }}
                        className="px-3 py-1 text-sm text-[#0891b2] hover:text-[#0e7490] border border-[#0891b2] rounded hover:bg-[#f0f9ff] transition-colors"
                      >
                        Reassign
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            
            {error && (
              <div className="mt-4 text-red-600 text-sm">{error}</div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowTeamMembers(false);
                  setViewingTeam(null);
                  setTeamMembers([]);
                  setError('');
                }}
                className="px-4 py-2 text-[#64748b] hover:text-[#0f172a]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Timeline Modal */}
      {showEditTimeline && (
        <div className="fixed inset-0 bg-[#f8fafc] bg-opacity-60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-[#e2e8f0]">
            <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Adjust Poll Timeline</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                />
              </div>
              <p className="text-sm text-[#64748b]">
                You can extend the poll duration even after it has ended.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowEditTimeline(false);
                    setError('');
                  }}
                  className="px-4 py-2 text-[#64748b] hover:text-[#0f172a]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTimeline}
                  disabled={submitting}
                  className="px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Timeline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
