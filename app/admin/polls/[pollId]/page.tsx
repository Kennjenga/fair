'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Poll management page content
 */
function PollManagementPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const pollId = params?.pollId as string;
  
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [poll, setPoll] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [judges, setJudges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any>(null);
  
  // Judge management states
  const [showAddJudge, setShowAddJudge] = useState(false);
  const [judgeEmail, setJudgeEmail] = useState('');
  const [judgeName, setJudgeName] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'voters' | 'judges' | 'results'>('overview');
  
  // Tie-breaker states
  const [showTieBreaker, setShowTieBreaker] = useState(false);
  const [tiedTeamIds, setTiedTeamIds] = useState<string[]>([]);
  const [tieBreakerName, setTieBreakerName] = useState('');
  const [tieBreakerStartTime, setTieBreakerStartTime] = useState('');
  const [tieBreakerEndTime, setTieBreakerEndTime] = useState('');
  
  // Modal states
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showRegisterVoters, setShowRegisterVoters] = useState(false);
  const [showEditTimeline, setShowEditTimeline] = useState(false);
  const [showEditPoll, setShowEditPoll] = useState(false);
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
  const [selectedReassignTeam, setSelectedReassignTeam] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // Edit poll form states
  const [editPollName, setEditPollName] = useState('');
  const [editPollStartTime, setEditPollStartTime] = useState('');
  const [editPollEndTime, setEditPollEndTime] = useState('');
  const [editPollVotingMode, setEditPollVotingMode] = useState<'single' | 'multiple' | 'ranked'>('single');
  const [editPollVotingPermissions, setEditPollVotingPermissions] = useState<'voters_only' | 'judges_only' | 'voters_and_judges'>('voters_and_judges');
  const [editPollVoterWeight, setEditPollVoterWeight] = useState('1.0');
  const [editPollJudgeWeight, setEditPollJudgeWeight] = useState('1.0');
  const [editPollAllowSelfVote, setEditPollAllowSelfVote] = useState(false);
  const [editPollRequireTeamNameGate, setEditPollRequireTeamNameGate] = useState(true);
  const [editPollIsPublicResults, setEditPollIsPublicResults] = useState(false);
  const [editPollMaxRankedPositions, setEditPollMaxRankedPositions] = useState('');
  const [editPollVotingSequence, setEditPollVotingSequence] = useState<'simultaneous' | 'voters_first'>('simultaneous');
  const [editPollAllowVoteEditing, setEditPollAllowVoteEditing] = useState(false);
  const [editPollMinVoterParticipation, setEditPollMinVoterParticipation] = useState('');
  const [editPollMinJudgeParticipation, setEditPollMinJudgeParticipation] = useState('');
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

  // Handle edit query parameter
  useEffect(() => {
    if (poll && searchParams?.get('edit') === 'true') {
      // Populate edit form with current poll data
      setEditPollName(poll.name);
      const start = new Date(poll.start_time);
      const end = new Date(poll.end_time);
      setEditPollStartTime(start.toISOString().slice(0, 16));
      setEditPollEndTime(end.toISOString().slice(0, 16));
      setEditPollVotingMode(poll.voting_mode || 'single');
      setEditPollVotingPermissions(poll.voting_permissions || 'voters_and_judges');
      setEditPollVoterWeight(poll.voter_weight?.toString() || '1.0');
      setEditPollJudgeWeight(poll.judge_weight?.toString() || '1.0');
      setEditPollAllowSelfVote(poll.allow_self_vote || false);
      setEditPollRequireTeamNameGate(poll.require_team_name_gate !== false);
      setEditPollIsPublicResults(poll.is_public_results || false);
      setEditPollMaxRankedPositions(poll.max_ranked_positions?.toString() || '');
      setEditPollVotingSequence(poll.voting_sequence || 'simultaneous');
      setEditPollAllowVoteEditing(poll.allow_vote_editing || false);
      setEditPollMinVoterParticipation(poll.min_voter_participation?.toString() || '');
      setEditPollMinJudgeParticipation(poll.min_judge_participation?.toString() || '');
      setShowEditPoll(true);
      // Remove query param from URL
      router.replace(`/admin/polls/${pollId}`, { scroll: false });
    }
  }, [poll, searchParams, pollId, router]);

  // Handle active tab based on voting permissions
  // If current tab is hidden, switch to a valid tab
  useEffect(() => {
    if (!poll) return;
    
    // Get voting permissions - check both snake_case and camelCase
    const votingPermissions = poll.voting_permissions || (poll as any).votingPermissions;
    if (!votingPermissions) return;
    
    const shouldShowTab = (tab: string) => {
      if (tab === 'voters' && votingPermissions === 'judges_only') return false;
      if (tab === 'judges' && votingPermissions === 'voters_only') return false;
      return true;
    };
    
    if (!shouldShowTab(activeTab)) {
      // Switch to overview if current tab is hidden
      setActiveTab('overview');
    }
  }, [poll, activeTab]);

  const fetchPollData = async (token: string) => {
    if (!pollId) return;
    
    try {
      const [pollRes, teamsRes, tokensRes, judgesRes, resultsRes] = await Promise.all([
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
        fetch(`/api/v1/results/${pollId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null), // Results might not be available yet
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
      
      if (resultsRes && resultsRes.ok) {
        const resultsData = await resultsRes.json();
        setResults(resultsData);
      }

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
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-[#0f172a] mb-2">{poll.name}</h1>
              <button
                onClick={() => {
                  // Populate edit form with current poll data
                  setEditPollName(poll.name);
                  const start = new Date(poll.start_time);
                  const end = new Date(poll.end_time);
                  setEditPollStartTime(start.toISOString().slice(0, 16));
                  setEditPollEndTime(end.toISOString().slice(0, 16));
                  setEditPollVotingMode(poll.voting_mode || 'single');
                  setEditPollVotingPermissions(poll.voting_permissions || 'voters_and_judges');
                  setEditPollVoterWeight(poll.voter_weight?.toString() || '1.0');
                  setEditPollJudgeWeight(poll.judge_weight?.toString() || '1.0');
                  setEditPollAllowSelfVote(poll.allow_self_vote || false);
                  setEditPollRequireTeamNameGate(poll.require_team_name_gate !== false);
                  setEditPollIsPublicResults(poll.is_public_results || false);
                  setEditPollMaxRankedPositions(poll.max_ranked_positions?.toString() || '');
                  setEditPollVotingSequence(poll.voting_sequence || 'simultaneous');
                  setEditPollAllowVoteEditing(poll.allow_vote_editing || false);
                  setEditPollMinVoterParticipation(poll.min_voter_participation?.toString() || '');
                  setEditPollMinJudgeParticipation(poll.min_judge_participation?.toString() || '');
                  setShowEditPoll(true);
                }}
                className="p-2 text-[#1e40af] hover:text-[#1e3a8a] hover:bg-blue-50 rounded transition-colors"
                title="Edit Poll Details"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
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
            {(['overview', 'teams', 'voters', 'judges', 'results'] as const)
              .filter((tab) => {
                // Filter tabs based on voting permissions
                // Only filter if poll is loaded and has voting_permissions
                if (!poll) {
                  return true; // Show all tabs while loading
                }
                
                // Get voting permissions - check both snake_case and camelCase
                const votingPermissions = poll.voting_permissions || (poll as any).votingPermissions;
                
                if (!votingPermissions) {
                  return true; // Show all tabs if voting_permissions is not set
                }
                
                // Hide voters tab if poll is judges only
                if (tab === 'voters' && votingPermissions === 'judges_only') {
                  return false;
                }
                
                // Hide judges tab if poll is voters only
                if (tab === 'judges' && votingPermissions === 'voters_only') {
                  return false;
                }
                
                return true;
              })
              .map((tab) => (
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

        {activeTab === 'voters' && poll && (poll.voting_permissions || (poll as any).votingPermissions) !== 'judges_only' && (
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
                {tokens.length > 0 && (
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem('auth_token');
                      if (!token) return;
                      
                      setSubmitting(true);
                      setError('');
                      setSuccess('');
                      
                      try {
                        const response = await fetch(`/api/v1/admin/polls/${pollId}/voters/send-emails`, {
                          method: 'POST',
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                        });
                        
                        const data = await response.json();
                        
                        if (response.ok) {
                          setSuccess(`Emails sent: ${data.sent}, Failed: ${data.failed}`);
                          // Refresh tokens to update delivery status
                          const tokensRes = await fetch(`/api/v1/admin/polls/${pollId}/voters`, {
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          const tokensData = await tokensRes.json();
                          setTokens(tokensData.tokens || []);
                        } else {
                          setError(data.error || 'Failed to send emails');
                        }
                      } catch (err) {
                        setError('An error occurred while sending emails');
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    disabled={submitting}
                    className="bg-[#1e40af] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#1e3a8a] transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Sending...' : 'Send Emails'}
                  </button>
                )}
              </div>
            </div>
            {tokens.length === 0 ? (
              <p className="text-[#64748b]">No voters registered yet.</p>
            ) : (
              <div className="space-y-2">
                {tokens.map((token) => {
                  const team = teams.find(t => t.team_id === token.team_id || t.team_id === token.teamId);
                  // Format delivery status for display
                  const getDeliveryStatusDisplay = (status: string | undefined) => {
                    if (!status || status === 'queued') return { text: 'Email not sent', color: 'text-yellow-600' };
                    if (status === 'sent') return { text: 'Email sent', color: 'text-green-600' };
                    if (status === 'delivered') return { text: 'Email delivered', color: 'text-green-700' };
                    if (status === 'failed' || status === 'bounced') return { text: 'Email failed', color: 'text-red-600' };
                    return { text: 'Unknown', color: 'text-gray-600' };
                  };
                  const deliveryStatus = getDeliveryStatusDisplay(token.deliveryStatus);
                  return (
                    <div key={token.tokenId} className="border border-[#e2e8f0] rounded-lg p-4 flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium text-[#0f172a]">{token.email}</div>
                        <div className="text-sm text-[#64748b] mt-1">
                          Team: <span className="font-medium">{team?.team_name || 'Unknown'}</span> • 
                          <span className={`ml-1 ${deliveryStatus.color}`}>{deliveryStatus.text}</span> • 
                          {token.used ? <span className="text-green-600 ml-1">Voted</span> : <span className="text-gray-500 ml-1">Not Voted</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
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
                        <button
                          onClick={async () => {
                            if (!confirm(`Are you sure you want to remove "${token.email}"? This will invalidate their token and delete their vote if they have already voted. This action cannot be undone.`)) {
                              return;
                            }
                            
                            const token2 = localStorage.getItem('auth_token');
                            if (!token2) return;
                            
                            setSubmitting(true);
                            setError('');
                            setSuccess('');
                            
                            try {
                              const response = await fetch(`/api/v1/admin/polls/${pollId}/voters/${token.tokenId}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token2}` },
                              });
                              
                              const data = await response.json();
                              
                              if (!response.ok) {
                                setError(data.error || 'Failed to remove voter');
                                setSubmitting(false);
                                return;
                              }
                              
                              setSuccess('Voter removed successfully. Token invalidated and votes deleted.');
                              // Refresh tokens list
                              const tokensRes = await fetch(`/api/v1/admin/polls/${pollId}/voters`, {
                                headers: { Authorization: `Bearer ${token2}` },
                              });
                              const tokensData = await tokensRes.json();
                              setTokens(tokensData.tokens || []);
                            } catch (err) {
                              setError('Failed to remove voter');
                            } finally {
                              setSubmitting(false);
                            }
                          }}
                          disabled={submitting}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'judges' && poll && (poll.voting_permissions || (poll as any).votingPermissions) !== 'voters_only' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#0f172a]">Judges</h2>
              <div className="flex gap-2">
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
                {judges.length > 0 && (
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem('auth_token');
                      if (!token) return;
                      
                      setSubmitting(true);
                      setError('');
                      setSuccess('');
                      
                      try {
                        const response = await fetch(`/api/v1/admin/polls/${pollId}/judges/send-emails`, {
                          method: 'POST',
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                        });
                        
                        const data = await response.json();
                        
                        if (response.ok) {
                          setSuccess(`Emails sent: ${data.sent}, Failed: ${data.failed}`);
                        } else {
                          setError(data.error || 'Failed to send emails');
                        }
                      } catch (err) {
                        setError('An error occurred while sending emails');
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    disabled={submitting}
                    className="bg-[#059669] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#047857] transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Sending...' : 'Send Emails'}
                  </button>
                )}
              </div>
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#0f172a]">Results</h2>
              <Link
                href={`/results/${pollId}`}
                className="bg-[#0891b2] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0e7490] transition-colors"
              >
                View Full Results →
              </Link>
            </div>
            
            <p className="text-[#64748b] mb-4">
              {poll.is_public_results 
                ? 'Results are publicly available.' 
                : 'Results are private. Only you and super admins can view them.'}
            </p>
            
            {results && results.results && results.results.teams && results.results.teams.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#f8fafc] rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-[#1e40af]">{results.results.totalVotes || 0}</div>
                    <div className="text-sm text-[#64748b]">Total Votes</div>
                  </div>
                  <div className="bg-[#f8fafc] rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-[#059669]">{results.results.teams.length}</div>
                    <div className="text-sm text-[#64748b]">Teams</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-[#0f172a]">Rankings</h3>
                  {results.results.teams
                    .sort((a: any, b: any) => b.totalScore - a.totalScore)
                    .slice(0, 5)
                    .map((team: any, index: number) => (
                      <div
                        key={team.teamId}
                        className="flex items-center justify-between p-3 border border-[#e2e8f0] rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-[#059669]' : index === 1 ? 'bg-[#0891b2]' : index === 2 ? 'bg-[#1e40af]' : 'bg-[#64748b]'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-[#0f172a]">{team.teamName}</div>
                            {poll.voting_mode === 'ranked' && team.positionCounts && Object.keys(team.positionCounts).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(team.positionCounts)
                                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                  .slice(0, 3)
                                  .map(([position, count]: [string, any]) => (
                                    <span
                                      key={position}
                                      className="text-xs px-1.5 py-0.5 rounded bg-[#e0f2fe] text-[#0369a1]"
                                    >
                                      #{position}: {count}×
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[#1e40af]">{team.totalScore.toFixed(2)}</div>
                          <div className="text-xs text-[#64748b]">points</div>
                        </div>
                      </div>
                    ))}
                </div>
                
                {/* Check for ties and show tie-breaker button */}
                {results.results.teams.length >= 2 && (() => {
                  const sorted = [...results.results.teams].sort((a: any, b: any) => b.totalScore - a.totalScore);
                  const topScore = sorted[0]?.totalScore;
                  const tiedTeams = sorted.filter((t: any) => Math.abs(t.totalScore - topScore) < 0.01);
                  
                  if (tiedTeams.length >= 2) {
                    return (
                      <div className="mt-6 p-4 bg-[#fef3c7] border border-[#fbbf24] rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-[#92400e] mb-2">Tie Detected!</h4>
                            <p className="text-sm text-[#78350f] mb-2">
                              {tiedTeams.length} teams are tied with {topScore.toFixed(2)} points:
                            </p>
                            <ul className="text-sm text-[#78350f] list-disc list-inside">
                              {tiedTeams.map((team: any) => (
                                <li key={team.teamId}>{team.teamName}</li>
                              ))}
                            </ul>
                          </div>
                          <button
                            onClick={() => {
                              setTiedTeamIds(tiedTeams.map((t: any) => t.teamId));
                              setTieBreakerName(`${poll.name} - Tie Breaker`);
                              const now = new Date();
                              const defaultStart = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
                              const defaultEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
                              setTieBreakerStartTime(defaultStart);
                              setTieBreakerEndTime(defaultEnd);
                              setShowTieBreaker(true);
                            }}
                            className="bg-[#f59e0b] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d97706] transition-colors whitespace-nowrap ml-4"
                          >
                            Create Tie-Breaker
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-[#64748b]">
                No votes recorded yet. Results will appear here once voting begins.
              </div>
            )}
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

      {/* Edit Poll Modal */}
      {showEditPoll && (
        <div className="fixed inset-0 bg-[#f8fafc] bg-opacity-60 backdrop-blur-md flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 my-8 border border-[#e2e8f0]">
            <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Edit Poll Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">
                  Poll Name *
                </label>
                <input
                  type="text"
                  value={editPollName}
                  onChange={(e) => setEditPollName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                  placeholder="Poll name"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-1">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={editPollStartTime}
                    onChange={(e) => setEditPollStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-1">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={editPollEndTime}
                    onChange={(e) => setEditPollEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">
                  Voting Mode *
                </label>
                <select
                  value={editPollVotingMode}
                  onChange={(e) => {
                    setEditPollVotingMode(e.target.value as any);
                    if (e.target.value !== 'ranked') {
                      setEditPollMaxRankedPositions('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                >
                  <option value="single">Single Vote (one team per voter)</option>
                  <option value="multiple">Multiple Votes (vote for multiple teams)</option>
                  <option value="ranked">Ranked Voting (rank teams 1, 2, 3...)</option>
                </select>
              </div>

              {editPollVotingMode === 'ranked' && (
                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-1">
                    Maximum Positions to Rank (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editPollMaxRankedPositions}
                    onChange={(e) => setEditPollMaxRankedPositions(e.target.value)}
                    className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                    placeholder="Leave empty to rank all teams"
                  />
                  <p className="text-xs text-[#64748b] mt-1">
                    Limit how many positions voters/judges can rank (e.g., "3" means rank top 3 only). Leave empty to allow ranking all teams.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">
                  Voting Permissions *
                </label>
                <select
                  value={editPollVotingPermissions}
                  onChange={(e) => {
                    setEditPollVotingPermissions(e.target.value as any);
                    if (e.target.value !== 'voters_and_judges') {
                      setEditPollVotingSequence('simultaneous');
                    }
                  }}
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                >
                  <option value="voters_only">Voters Only</option>
                  <option value="judges_only">Judges Only</option>
                  <option value="voters_and_judges">Voters and Judges</option>
                </select>
              </div>

              {editPollVotingPermissions === 'voters_and_judges' && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0f172a] mb-1">
                        Voter Weight
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={editPollVoterWeight}
                        onChange={(e) => setEditPollVoterWeight(e.target.value)}
                        className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                      />
                      <p className="text-xs text-[#64748b] mt-1">Weight multiplier for voter votes</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0f172a] mb-1">
                        Judge Weight
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={editPollJudgeWeight}
                        onChange={(e) => setEditPollJudgeWeight(e.target.value)}
                        className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                      />
                      <p className="text-xs text-[#64748b] mt-1">Weight multiplier for judge votes</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0f172a] mb-1">
                      Voting Sequence *
                    </label>
                    <select
                      value={editPollVotingSequence}
                      onChange={(e) => setEditPollVotingSequence(e.target.value as any)}
                      className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                    >
                      <option value="simultaneous">Simultaneous (voters and judges can vote at the same time)</option>
                      <option value="voters_first">Voters First (judges must wait until all voters have voted)</option>
                    </select>
                    <p className="text-xs text-[#64748b] mt-1">
                      {editPollVotingSequence === 'voters_first' 
                        ? 'Judges will be blocked from voting until all registered voters have completed their votes.'
                        : 'Both voters and judges can vote at any time during the poll period.'}
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editPollAllowSelfVote}
                    onChange={(e) => setEditPollAllowSelfVote(e.target.checked)}
                    className="w-4 h-4 text-[#1e40af] border-[#94a3b8] rounded focus:ring-[#1e40af]"
                  />
                  <label className="ml-2 text-sm text-[#0f172a]">
                    Allow self-voting (voters can vote for their own team)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editPollRequireTeamNameGate}
                    onChange={(e) => setEditPollRequireTeamNameGate(e.target.checked)}
                    className="w-4 h-4 text-[#1e40af] border-[#94a3b8] rounded focus:ring-[#1e40af]"
                  />
                  <label className="ml-2 text-sm text-[#0f172a]">
                    Require team name verification (voters must enter their team name)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editPollIsPublicResults}
                    onChange={(e) => setEditPollIsPublicResults(e.target.checked)}
                    className="w-4 h-4 text-[#1e40af] border-[#94a3b8] rounded focus:ring-[#1e40af]"
                  />
                  <label className="ml-2 text-sm text-[#0f172a]">
                    Make results public (anyone can view results without authentication)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editPollAllowVoteEditing}
                    onChange={(e) => setEditPollAllowVoteEditing(e.target.checked)}
                    className="w-4 h-4 text-[#1e40af] border-[#94a3b8] rounded focus:ring-[#1e40af]"
                  />
                  <label className="ml-2 text-sm text-[#0f172a]">
                    Allow vote editing (voters and judges can change their votes after submission)
                  </label>
                </div>
              </div>

              {/* Quorum Requirements */}
              <div className="space-y-4 pt-4 border-t border-[#e2e8f0]">
                <h3 className="text-lg font-semibold text-[#0f172a]">Quorum Requirements</h3>
                <p className="text-sm text-[#64748b]">
                  Set minimum participation thresholds. Leave empty for no requirement.
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-1">
                    Minimum Voter Participation
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editPollMinVoterParticipation}
                    onChange={(e) => setEditPollMinVoterParticipation(e.target.value)}
                    className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                    placeholder="Leave empty for no requirement"
                  />
                  <p className="text-xs text-[#64748b] mt-1">
                    Minimum number of voters who must vote for results to be valid
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-1">
                    Minimum Judge Participation
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editPollMinJudgeParticipation}
                    onChange={(e) => setEditPollMinJudgeParticipation(e.target.value)}
                    className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                    placeholder="Leave empty for no requirement"
                  />
                  <p className="text-xs text-[#64748b] mt-1">
                    Minimum number of judges who must vote for results to be valid
                  </p>
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}
              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={() => {
                    setShowEditPoll(false);
                    setError('');
                  }}
                  className="px-4 py-2 text-[#64748b] hover:text-[#0f172a]"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!editPollName.trim() || !editPollStartTime || !editPollEndTime) {
                      setError('Poll name, start time, and end time are required');
                      return;
                    }

                    const startDate = new Date(editPollStartTime);
                    const endDate = new Date(editPollEndTime);

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

                    const token = localStorage.getItem('auth_token');
                    if (!token) return;

                    try {
                      const updateData: any = {
                        name: editPollName.trim(),
                        startTime: startDate.toISOString(),
                        endTime: endDate.toISOString(),
                        votingMode: editPollVotingMode,
                        votingPermissions: editPollVotingPermissions,
                        voterWeight: parseFloat(editPollVoterWeight) || 1.0,
                        judgeWeight: parseFloat(editPollJudgeWeight) || 1.0,
                        allowSelfVote: editPollAllowSelfVote,
                        requireTeamNameGate: editPollRequireTeamNameGate,
                        isPublicResults: editPollIsPublicResults,
                      };

                      if (editPollVotingMode === 'ranked' && editPollMaxRankedPositions) {
                        updateData.maxRankedPositions = parseInt(editPollMaxRankedPositions, 10);
                      } else if (editPollVotingMode === 'ranked' && !editPollMaxRankedPositions) {
                        updateData.maxRankedPositions = null;
                      }

                      if (editPollVotingPermissions === 'voters_and_judges') {
                        updateData.votingSequence = editPollVotingSequence;
                      }

                      updateData.allowVoteEditing = editPollAllowVoteEditing;
                      updateData.minVoterParticipation = editPollMinVoterParticipation ? parseInt(editPollMinVoterParticipation, 10) : null;
                      updateData.minJudgeParticipation = editPollMinJudgeParticipation ? parseInt(editPollMinJudgeParticipation, 10) : null;

                      const response = await fetch(`/api/v1/admin/polls/${pollId}`, {
                        method: 'PATCH',
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(updateData),
                      });

                      const data = await response.json();

                      if (!response.ok) {
                        setError(data.error || 'Failed to update poll');
                        setSubmitting(false);
                        return;
                      }

                      setSuccess('Poll updated successfully');
                      setShowEditPoll(false);
                      fetchPollData(token);
                    } catch (err) {
                      setError('Failed to update poll');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  className="px-4 py-2 bg-[#1e40af] text-white rounded-lg hover:bg-[#1e3a8a] disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Poll'}
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

      {/* Tie-Breaker Modal */}
      {showTieBreaker && (
        <div className="fixed inset-0 bg-[#f8fafc] bg-opacity-60 backdrop-blur-md flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 max-w-md w-full mx-4 my-8 border border-[#e2e8f0]">
            <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Create Tie-Breaker Poll</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">
                  Poll Name *
                </label>
                <input
                  type="text"
                  value={tieBreakerName}
                  onChange={(e) => setTieBreakerName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                  placeholder="Tie-Breaker Poll Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={tieBreakerStartTime}
                  onChange={(e) => setTieBreakerStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={tieBreakerEndTime}
                  onChange={(e) => setTieBreakerEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                />
              </div>
              
              <div className="bg-[#f8fafc] rounded-lg p-3">
                <p className="text-sm font-medium text-[#0f172a] mb-2">Tied Teams ({tiedTeamIds.length}):</p>
                <ul className="text-sm text-[#64748b] list-disc list-inside">
                  {tiedTeamIds.map((teamId) => {
                    const team = teams.find(t => t.team_id === teamId);
                    return <li key={teamId}>{team?.team_name || teamId}</li>;
                  })}
                </ul>
                <p className="text-xs text-[#64748b] mt-2">
                  The tie-breaker poll will inherit all settings from the original poll and only include the tied teams.
                </p>
              </div>
              
              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}
              
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowTieBreaker(false);
                    setTiedTeamIds([]);
                    setTieBreakerName('');
                    setTieBreakerStartTime('');
                    setTieBreakerEndTime('');
                    setError('');
                  }}
                  className="px-4 py-2 text-[#64748b] hover:text-[#0f172a]"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!tieBreakerName || !tieBreakerStartTime || !tieBreakerEndTime) {
                      setError('All fields are required');
                      return;
                    }
                    
                    const startDate = new Date(tieBreakerStartTime);
                    const endDate = new Date(tieBreakerEndTime);
                    
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
                    
                    const token = localStorage.getItem('auth_token');
                    if (!token) return;
                    
                    try {
                      const response = await fetch(`/api/v1/admin/polls/${pollId}/tie-breaker`, {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          tiedTeamIds,
                          name: tieBreakerName,
                          startTime: startDate.toISOString(),
                          endTime: endDate.toISOString(),
                        }),
                      });
                      
                      const data = await response.json();
                      
                      if (!response.ok) {
                        setError(data.error || 'Failed to create tie-breaker poll');
                        setSubmitting(false);
                        return;
                      }
                      
                      setSuccess('Tie-breaker poll created successfully!');
                      setShowTieBreaker(false);
                      setTiedTeamIds([]);
                      setTieBreakerName('');
                      setTieBreakerStartTime('');
                      setTieBreakerEndTime('');
                      
                      // Redirect to the new tie-breaker poll
                      router.push(`/admin/polls/${data.poll.poll_id}`);
                    } catch (err) {
                      setError('Failed to create tie-breaker poll');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  className="px-4 py-2 bg-[#f59e0b] text-white rounded-lg hover:bg-[#d97706] disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Tie-Breaker Poll'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Poll management page (with Suspense wrapper for useSearchParams)
 */
export default function PollManagementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-[#64748b]">Loading...</div>
      </div>
    }>
      <PollManagementPageContent />
    </Suspense>
  );
}
