'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layouts';
import { Button, Card, Input, Badge } from '@/components/ui';
import { Search } from 'lucide-react';

const sidebarItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { label: 'Hackathons', href: '/admin/hackathons', icon: '🏆' },
  { label: 'Polls', href: '/admin/polls', icon: '🗳️' },
];

/**
 * Poll management page content with modern design
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Searchable dropdown states for team selection
  const [teamSearchOpen, setTeamSearchOpen] = useState<{ [key: number]: boolean }>({});
  const [teamSearchQuery, setTeamSearchQuery] = useState<{ [key: number]: string }>({});
  const [reassignTeamSearchOpen, setReassignTeamSearchOpen] = useState(false);
  const [reassignTeamSearchQuery, setReassignTeamSearchQuery] = useState('');
  
  // Team migration states
  const [showMigrateTeams, setShowMigrateTeams] = useState(false);
  const [availablePolls, setAvailablePolls] = useState<any[]>([]);
  const [selectedTeamsToMigrate, setSelectedTeamsToMigrate] = useState<string[]>([]);
  const [targetPollId, setTargetPollId] = useState('');
  
  // Search and filter states
  const [teamsSearch, setTeamsSearch] = useState('');
  const [votersSearch, setVotersSearch] = useState('');
  const [votersFilter, setVotersFilter] = useState<'all' | 'voted' | 'not_voted'>('all');
  const [teamsFilter, setTeamsFilter] = useState<'all' | 'with_members' | 'no_members'>('all');

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
  useEffect(() => {
    if (!poll) return;

    const votingPermissions = poll.voting_permissions || (poll as any).votingPermissions;
    if (!votingPermissions) return;

    const shouldShowTab = (tab: string) => {
      if (tab === 'voters' && votingPermissions === 'judges_only') return false;
      if (tab === 'judges' && votingPermissions === 'voters_only') return false;
      return true;
    };

    if (!shouldShowTab(activeTab)) {
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
        }).catch(() => null),
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
    if (field === 'teamName') {
      setTeamSearchQuery({ ...teamSearchQuery, [index]: value });
    }
  };

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
    return () => { };
  }, [teamSearchOpen, reassignTeamSearchOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-[#64748B]">Loading...</div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Poll Not Found</h2>
          <Link href="/admin/dashboard" className="text-[#4F46E5] hover:text-[#4338ca]">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar items={sidebarItems} user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#0F172A] mb-2">{poll.name}</h1>
              <p className="text-[#64748B]">
                {new Date(poll.start_time).toLocaleString()} - {new Date(poll.end_time).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowEditTimeline(true)} variant="outline" className="bg-white">
                Adjust Timeline
              </Button>
              <Button
                onClick={() => {
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
                className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1]"
              >
                Edit Details
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-[#E2E8F0] mb-6 no-scrollbar gap-6">
            {(['overview', 'teams', 'voters', 'judges', 'results'] as const)
              .filter((tab) => {
                const votingPermissions = poll.voting_permissions || (poll as any).votingPermissions;
                if (!votingPermissions) return true;
                if (tab === 'voters' && votingPermissions === 'judges_only') return false;
                if (tab === 'judges' && votingPermissions === 'voters_only') return false;
                return true;
              })
              .map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 font-medium transition-all border-b-2 ${activeTab === tab
                    ? 'border-[#4F46E5] text-[#4F46E5]'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
          </div>

          {/* Messages */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <span>✅</span> {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Content */}
          {activeTab === 'overview' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-[#0F172A] mb-6">Poll Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#64748B]">Status</p>
                  <Badge
                    className={`${new Date() >= new Date(poll.start_time) && new Date() <= new Date(poll.end_time)
                      ? 'bg-green-100 text-green-800 hover:bg-green-100'
                      : new Date() < new Date(poll.start_time)
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                      }`}
                  >
                    {new Date() >= new Date(poll.start_time) && new Date() <= new Date(poll.end_time)
                      ? 'Active'
                      : new Date() < new Date(poll.start_time)
                        ? 'Upcoming'
                        : 'Ended'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#64748B]">Teams</p>
                  <p className="text-lg font-semibold text-[#0F172A]">{teams.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#64748B]">Registered Voters</p>
                  <p className="text-lg font-semibold text-[#0F172A]">{tokens.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#64748B]">Results Public</p>
                  <p className="text-lg font-semibold text-[#0F172A]">{poll.is_public_results ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'teams' && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#0F172A]">Teams</h2>
                <div className="flex gap-3">
                  <Button 
                    onClick={async () => {
                      // Pull teams from hackathon
                      const token = localStorage.getItem('auth_token');
                      if (!token) return;
                      setSubmitting(true);
                      setError('');
                      setSuccess('');
                      try {
                        // Get hackathon teams
                        const hackathonTeamsRes = await fetch(`/api/v1/admin/polls/${pollId}/hackathon-teams`, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (!hackathonTeamsRes.ok) {
                          const errorData = await hackathonTeamsRes.json();
                          throw new Error(errorData.error || 'Failed to fetch hackathon teams');
                        }
                        const hackathonTeamsData = await hackathonTeamsRes.json();
                        const hackathonTeams = hackathonTeamsData.teams || [];
                        
                        if (hackathonTeams.length === 0) {
                          setError('No teams found in hackathon. Teams must be created through team_formation submissions first.');
                          return;
                        }
                        
                        // Create teams in poll that don't exist
                        const existingTeamNames = new Set(teams.map(t => t.team_name));
                        const teamsToCreate = hackathonTeams.filter((ht: any) => !existingTeamNames.has(ht.teamName));
                        
                        if (teamsToCreate.length === 0) {
                          setSuccess('All hackathon teams are already in this poll.');
                          return;
                        }
                        
                        // Create teams
                        for (const hackathonTeam of teamsToCreate) {
                          try {
                            await fetch(`/api/v1/admin/polls/${pollId}/teams`, {
                              method: 'POST',
                              headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ teamName: hackathonTeam.teamName }),
                            });
                          } catch (err) {
                            console.error(`Failed to create team "${hackathonTeam.teamName}":`, err);
                          }
                        }
                        
                        setSuccess(`Successfully imported ${teamsToCreate.length} team(s) from hackathon!`);
                        fetchPollData(token);
                      } catch (err: any) {
                        setError(err.message || 'Failed to pull teams from hackathon');
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    isLoading={submitting}
                    variant="outline"
                    className="border-[#059669] text-[#059669] hover:bg-[#059669]/10"
                  >
                    Pull from Hackathon
                  </Button>
                  {teams.length > 0 && (
                    <Button 
                      onClick={async () => {
                        // Fetch polls in the same hackathon
                        const token = localStorage.getItem('auth_token');
                        if (!token) return;
                        try {
                          const pollsRes = await fetch(`/api/v1/admin/hackathons/${poll.hackathon_id}/polls`, {
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          const pollsData = await pollsRes.json();
                          // Filter out current poll
                          const otherPolls = (pollsData.polls || []).filter((p: any) => p.poll_id !== pollId);
                          setAvailablePolls(otherPolls);
                          setSelectedTeamsToMigrate([]);
                          setTargetPollId('');
                          setShowMigrateTeams(true);
                        } catch (err) {
                          setError('Failed to load polls');
                        }
                      }}
                      variant="outline"
                      className="border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5]/10"
                    >
                      Duplicate Teams
                    </Button>
                  )}
                  <Button onClick={() => setShowAddTeam(true)} className="bg-[#0891b2] hover:bg-[#0e7490]">
                    Add Team
                  </Button>
                </div>
              </div>
              
              {/* Search and Filter */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search teams..."
                    value={teamsSearch}
                    onChange={(e) => setTeamsSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
                <select
                  value={teamsFilter}
                  onChange={(e) => setTeamsFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Teams</option>
                  <option value="with_members">With Members</option>
                  <option value="no_members">No Members</option>
                </select>
              </div>
              
              {(() => {
                // Filter teams based on search and filter
                let filteredTeams = teams;
                
                if (teamsSearch) {
                  const query = teamsSearch.toLowerCase();
                  filteredTeams = filteredTeams.filter(t => 
                    t.team_name.toLowerCase().includes(query)
                  );
                }
                
                if (teamsFilter !== 'all') {
                  filteredTeams = filteredTeams.filter(team => {
                    const memberCount = tokens.filter(t =>
                      t.team_id === team.team_id || t.teamId === team.team_id
                    ).length;
                    return teamsFilter === 'with_members' ? memberCount > 0 : memberCount === 0;
                  });
                }
                
                return filteredTeams.length === 0 ? (
                  <p className="text-[#64748B] text-center py-8">
                    {teams.length === 0 
                      ? 'No teams added yet.' 
                      : 'No teams match your search criteria.'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredTeams.map((team) => {
                      const memberCount = tokens.filter(t =>
                        t.team_id === team.team_id || t.teamId === team.team_id
                      ).length;
                      return (
                        <div key={team.team_id} className="border border-[#E2E8F0] rounded-xl p-4 flex justify-between items-center hover:border-[#4F46E5]/50 transition-colors">
                          <div>
                            <div className="font-medium text-[#0F172A]">{team.team_name}</div>
                            <div className="text-sm text-[#64748B] mt-1">{memberCount} member(s)</div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/admin/polls/${pollId}/teams/${team.team_id}`)}
                              className="text-[#059669] hover:text-[#047857] hover:bg-[#ecfdf5]"
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingTeam(team);
                                setEditTeamName(team.team_name);
                                setShowEditTeam(true);
                              }}
                              className="text-[#0891b2] hover:text-[#0e7490] hover:bg-[#ecfeff]"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                if (!confirm(`Are you sure you want to delete "${team.team_name}"?`)) return;
                                const token = localStorage.getItem('auth_token');
                                if (!token) return;
                                try {
                                  const response = await fetch(`/api/v1/admin/polls/${pollId}/teams/${team.team_id}`, {
                                    method: 'DELETE',
                                    headers: { Authorization: `Bearer ${token}` },
                                  });
                                  if (!response.ok) throw new Error('Failed to delete');
                                  setSuccess('Team deleted successfully');
                                  fetchPollData(token);
                                } catch (err) {
                                  setError('Failed to delete team');
                                }
                              }}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </Card>
          )}

          {activeTab === 'voters' && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#0F172A]">Voters</h2>
                <div className="flex gap-3">
                  <Button 
                    onClick={async () => {
                      // Auto-populate voters from team members
                      const token = localStorage.getItem('auth_token');
                      if (!token) return;
                      setSubmitting(true);
                      setError('');
                      setSuccess('');
                      try {
                        const response = await fetch(`/api/v1/admin/polls/${pollId}/auto-populate-voters`, {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        const data = await response.json();
                        if (response.ok) {
                          setSuccess(`Auto-populated ${data.votersCreated} voter(s) from ${data.teamsCreated} team(s)!`);
                          fetchPollData(token);
                        } else {
                          setError(data.error || 'Failed to auto-populate voters');
                        }
                      } catch (err: any) {
                        setError(err.message || 'An error occurred');
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    isLoading={submitting}
                    variant="outline"
                    className="border-[#059669] text-[#059669] hover:bg-[#059669]/10"
                  >
                    Auto-Populate from Teams
                  </Button>
                  <Button onClick={() => setShowRegisterVoters(true)} className="bg-[#059669] hover:bg-[#047857]">
                    Register Voters
                  </Button>
                  {tokens.length > 0 && (
                    <Button
                      onClick={async () => {
                        const token = localStorage.getItem('auth_token');
                        if (!token) return;
                        setSubmitting(true);
                        try {
                          const response = await fetch(`/api/v1/admin/polls/${pollId}/voters/send-emails`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                          });
                          const data = await response.json();
                          if (response.ok) {
                            setSuccess(`Emails sent: ${data.sent}, Failed: ${data.failed}`);
                            const tokensRes = await fetch(`/api/v1/admin/polls/${pollId}/voters`, {
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            const tokensData = await tokensRes.json();
                            setTokens(tokensData.tokens || []);
                          } else {
                            setError(data.error || 'Failed to send emails');
                          }
                        } catch (err) {
                          setError('An error occurred');
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      isLoading={submitting}
                      className="bg-[#1e40af] hover:bg-[#1e3a8a]"
                    >
                      Send Emails
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Search and Filter */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search voters by email or team..."
                    value={votersSearch}
                    onChange={(e) => setVotersSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
                <select
                  value={votersFilter}
                  onChange={(e) => setVotersFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Voters</option>
                  <option value="voted">Voted</option>
                  <option value="not_voted">Not Voted</option>
                </select>
              </div>
              
              {(() => {
                // Filter voters based on search and filter
                let filteredTokens = tokens;
                
                if (votersSearch) {
                  const query = votersSearch.toLowerCase();
                  filteredTokens = filteredTokens.filter(token => {
                    const team = teams.find(t => t.team_id === token.team_id || t.team_id === token.teamId);
                    return (
                      token.email.toLowerCase().includes(query) ||
                      team?.team_name.toLowerCase().includes(query)
                    );
                  });
                }
                
                if (votersFilter !== 'all') {
                  filteredTokens = filteredTokens.filter(token => {
                    const hasVoted = token.hasVoted !== undefined 
                      ? token.hasVoted 
                      : token.used;
                    return votersFilter === 'voted' ? hasVoted : !hasVoted;
                  });
                }
                
                return filteredTokens.length === 0 ? (
                  <p className="text-[#64748B] text-center py-8">
                    {tokens.length === 0 
                      ? 'No voters registered yet.' 
                      : 'No voters match your search criteria.'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredTokens.map((token) => {
                    const team = teams.find(t => t.team_id === token.team_id || t.team_id === token.teamId);
                    const getDeliveryStatusDisplay = (status: string | undefined) => {
                      if (!status || status === 'queued') return { text: 'Email not sent', color: 'text-gray-500' };
                      if (status === 'sent') return { text: 'Email sent', color: 'text-green-600' };
                      if (status === 'delivered') return { text: 'Email delivered', color: 'text-green-700' };
                      if (status === 'failed' || status === 'bounced') return { text: 'Email failed', color: 'text-red-600' };
                      return { text: 'Unknown', color: 'text-gray-600' };
                    };
                    const deliveryStatus = getDeliveryStatusDisplay(token.emailStatus || token.deliveryStatus);
                    return (
                      <div key={token.tokenId} className="border border-[#E2E8F0] rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <div className="font-medium text-[#0F172A]">{token.email}</div>
                          <div className="text-sm text-[#64748B] mt-1">
                            Team: <span className="font-medium">{team?.team_name || 'Unknown'}</span>
                            <span className="mx-1">•</span>
                            <span className={deliveryStatus.color}>{deliveryStatus.text}</span>
                            <span className="mx-1">•</span>
                            {token.hasVoted !== undefined ? (
                              token.hasVoted ? <span className="text-green-600">Voted</span> : <span className="text-gray-500">Not Voted</span>
                            ) : (
                              token.used ? <span className="text-green-600">Voted</span> : <span className="text-gray-500">Not Voted</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReassigningVoter(token);
                              setSelectedReassignTeam(token.team_id);
                              setReassignTeamSearchQuery(team?.team_name || '');
                              setShowReassignVoter(true);
                            }}
                          >
                            Reassign
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              if (!confirm(`Remove "${token.email}"?`)) return;
                              const token2 = localStorage.getItem('auth_token');
                              if (!token2) return;
                              try {
                                const response = await fetch(`/api/v1/admin/polls/${pollId}/voters/${token.tokenId}`, {
                                  method: 'DELETE',
                                  headers: { Authorization: `Bearer ${token2}` },
                                });
                                if (!response.ok) throw new Error('Failed');
                                setSuccess('Voter removed');
                                const tokensRes = await fetch(`/api/v1/admin/polls/${pollId}/voters`, {
                                  headers: { Authorization: `Bearer ${token2}` },
                                });
                                const tokensData = await tokensRes.json();
                                setTokens(tokensData.tokens || []);
                              } catch (err) {
                                setError('Failed to remove voter');
                              }
                            }}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                );
              })()}
            </Card>
          )}

          {activeTab === 'judges' && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#0F172A]">Judges</h2>
                <div className="flex gap-3">
                  <Button onClick={() => { setShowAddJudge(true); setJudgeEmail(''); setJudgeName(''); }} className="bg-[#1e40af] hover:bg-[#1e3a8a]">
                    Add Judge
                  </Button>
                  {judges.length > 0 && (
                    <Button
                      onClick={async () => {
                        const token = localStorage.getItem('auth_token');
                        if (!token) return;
                        setSubmitting(true);
                        try {
                          const response = await fetch(`/api/v1/admin/polls/${pollId}/judges/send-emails`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                          });
                          const data = await response.json();
                          if (response.ok) {
                            setSuccess(`Emails sent: ${data.sent}, Failed: ${data.failed}`);
                            // Refresh judges list to show updated email status
                            const token = localStorage.getItem('auth_token');
                            if (token) {
                              const judgesRes = await fetch(`/api/v1/admin/polls/${pollId}/judges`, {
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              const judgesData = await judgesRes.json();
                              setJudges(judgesData.judges || []);
                            }
                          } else {
                            setError(data.error || 'Failed');
                          }
                        } catch (err) {
                          setError('Error sending emails');
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      isLoading={submitting}
                      className="bg-[#059669] hover:bg-[#047857]"
                    >
                      Send Emails
                    </Button>
                  )}
                </div>
              </div>
              {judges.length === 0 ? (
                <p className="text-[#64748B] text-center py-8">No judges added yet.</p>
              ) : (
                <div className="space-y-3">
                  {judges.map((judge: any) => {
                    const getEmailStatusDisplay = (status: string | undefined) => {
                      if (!status || status === 'queued') return { text: 'Email not sent', color: 'text-gray-500' };
                      if (status === 'sent') return { text: 'Email sent', color: 'text-green-600' };
                      if (status === 'delivered') return { text: 'Email delivered', color: 'text-green-700' };
                      if (status === 'failed' || status === 'bounced') return { text: 'Email failed', color: 'text-red-600' };
                      return { text: 'Unknown', color: 'text-gray-600' };
                    };
                    const emailStatus = getEmailStatusDisplay(judge.emailStatus);
                    return (
                      <div key={judge.email} className="flex justify-between items-center p-4 border border-[#E2E8F0] rounded-xl">
                        <div>
                          <p className="font-medium text-[#0F172A]">{judge.email}</p>
                          <div className="text-sm text-[#64748B] mt-1">
                            {judge.name && <span>{judge.name}</span>}
                            {judge.name && <span className="mx-1">•</span>}
                            <span className={emailStatus.color}>{emailStatus.text}</span>
                            <span className="mx-1">•</span>
                            {judge.hasVoted ? <span className="text-green-600">Voted</span> : <span className="text-gray-500">Not Voted</span>}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            if (!confirm(`Remove ${judge.email}?`)) return;
                            const token = localStorage.getItem('auth_token');
                            if (!token) return;
                            try {
                              const response = await fetch(`/api/v1/admin/polls/${pollId}/judges/${encodeURIComponent(judge.email)}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              if (response.ok) {
                                setJudges(judges.filter(j => j.email !== judge.email));
                                setSuccess('Judge removed');
                              } else throw new Error('Failed');
                            } catch (err) {
                              setError('Error removing judge');
                            }
                          }}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {activeTab === 'results' && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#0F172A]">Results</h2>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTieBreakerName(`Tie Breaker: ${poll.name}`);
                      // Default to starting now and ending in 1 hour
                      const now = new Date();
                      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
                      setTieBreakerStartTime(now.toISOString().slice(0, 16));
                      setTieBreakerEndTime(oneHourLater.toISOString().slice(0, 16));
                      // Pre-select top 2 teams if available
                      if (results?.results?.teams?.length >= 2) {
                        const sorted = [...results.results.teams].sort((a: any, b: any) => b.totalScore - a.totalScore);
                        // Handle potential property name differences (teamId vs team_id)
                        const team1Id = sorted[0].teamId || sorted[0].team_id;
                        const team2Id = sorted[1].teamId || sorted[1].team_id;
                        if (team1Id && team2Id) {
                          setTiedTeamIds([team1Id, team2Id]);
                        }
                      }
                      setShowTieBreaker(true);
                    }}
                    className="border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/10"
                  >
                    Create Tie Breaker
                  </Button>
                  <Link href={`/results/${pollId}`}>
                    <Button className="bg-[#0891b2] hover:bg-[#0e7490]">View Full Results →</Button>
                  </Link>
                </div>
              </div>
              <p className="text-[#64748B] mb-6">
                {poll.is_public_results ? 'Results are publicly available.' : 'Results are private.'}
              </p>
              {results && results.results && results.results.teams && results.results.teams.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F8FAFC] rounded-xl p-4 text-center border border-[#E2E8F0]">
                      <div className="text-2xl font-bold text-[#1e40af]">{results.results.totalVotes || 0}</div>
                      <div className="text-sm text-[#64748B]">Total Votes</div>
                    </div>
                    <div className="bg-[#F8FAFC] rounded-xl p-4 text-center border border-[#E2E8F0]">
                      <div className="text-2xl font-bold text-[#059669]">{results.results.teams.length}</div>
                      <div className="text-sm text-[#64748B]">Teams</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-[#0F172A]">Rankings</h3>
                    {results.results.teams
                      .sort((a: any, b: any) => b.totalScore - a.totalScore)
                      .slice(0, 5)
                      .map((team: any, index: number) => (
                        <div key={team.teamId} className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-xl">
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-[#059669]' : index === 1 ? 'bg-[#0891b2]' : index === 2 ? 'bg-[#1e40af]' : 'bg-[#64748B]'}`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-[#0F172A]">{team.teamName}</div>
                              {poll.voting_mode === 'ranked' && team.positionCounts && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Object.entries(team.positionCounts).slice(0, 3).map(([pos, count]: [string, any]) => (
                                    <span key={pos} className="text-xs px-1.5 py-0.5 rounded bg-[#e0f2fe] text-[#0369a1]">
                                      #{pos}: {count}×
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-[#1e40af]">{Number(team.totalScore || 0).toFixed(2)}</div>
                            <div className="text-xs text-[#64748B]">points</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[#64748B]">No votes recorded yet.</div>
              )}
            </Card>
          )}
        </div>
      </main>

      {/* Modals - Wrapped in portal-like divs but kept simple for now */}
      {showAddTeam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-[#0F172A] mb-4">Add Team</h3>
            <div className="space-y-4">
              <Input
                label="Team Name *"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
              />
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setShowAddTeam(false)}>Cancel</Button>
                <Button onClick={handleAddTeam} isLoading={submitting}>Add Team</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showRegisterVoters && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl p-6 my-8">
            <h3 className="text-xl font-semibold text-[#0F172A] mb-4">Bulk Register Voters</h3>
            <p className="text-sm text-[#64748B] mb-4">Add multiple voters at once. Each voter needs an email and team name.</p>
            <div className="space-y-4">
              {votersList.map((voter, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Input
                      label="Email *"
                      value={voter.email}
                      onChange={(e) => updateVoterRow(index, 'email', e.target.value)}
                      placeholder="voter@example.com"
                    />
                  </div>
                  <div className="flex-1 relative team-search-dropdown">
                    <Input
                      label="Team Name *"
                      value={teamSearchQuery[index] !== undefined ? teamSearchQuery[index] : voter.teamName}
                      onChange={(e) => {
                        const query = e.target.value;
                        setTeamSearchQuery({ ...teamSearchQuery, [index]: query });
                        setTeamSearchOpen({ ...teamSearchOpen, [index]: true });
                        const exactMatch = teams.find(t => t.team_name.toLowerCase() === query.toLowerCase());
                        if (exactMatch) {
                          updateVoterRow(index, 'teamName', exactMatch.team_name);
                          setTeamSearchQuery({ ...teamSearchQuery, [index]: exactMatch.team_name });
                          setTeamSearchOpen({ ...teamSearchOpen, [index]: false });
                        } else {
                          updateVoterRow(index, 'teamName', query);
                        }
                      }}
                      onFocus={() => setTeamSearchOpen({ ...teamSearchOpen, [index]: true })}
                      placeholder="Search team"
                    />
                    {teamSearchOpen[index] && teams.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg max-h-60 overflow-auto">
                        {teams.filter(t => !teamSearchQuery[index] || t.team_name.toLowerCase().includes(teamSearchQuery[index].toLowerCase()))
                          .map(team => (
                            <button
                              key={team.team_id}
                              onClick={() => {
                                updateVoterRow(index, 'teamName', team.team_name);
                                setTeamSearchQuery({ ...teamSearchQuery, [index]: team.team_name });
                                setTeamSearchOpen({ ...teamSearchOpen, [index]: false });
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-[#F8FAFC]"
                            >
                              {team.team_name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  {votersList.length > 1 && (
                    <Button variant="ghost" className="mt-7 text-red-600" onClick={() => removeVoterRow(index)}>×</Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" onClick={addVoterRow} className="text-[#0891b2]">+ Add Another Voter</Button>
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setShowRegisterVoters(false)}>Cancel</Button>
                <Button onClick={handleRegisterVoters} isLoading={submitting} className="bg-[#059669]">Register Voters</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showAddJudge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-[#0F172A] mb-4">Add Judge</h3>
            <div className="space-y-4">
              <Input
                label="Email *"
                value={judgeEmail}
                onChange={(e) => setJudgeEmail(e.target.value)}
                placeholder="judge@example.com"
              />
              <Input
                label="Name (Optional)"
                value={judgeName}
                onChange={(e) => setJudgeName(e.target.value)}
                placeholder="Judge Name"
              />
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setShowAddJudge(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!judgeEmail) { setError('Email is required'); return; }
                    const token = localStorage.getItem('auth_token');
                    if (!token) return;
                    try {
                      const response = await fetch(`/api/v1/admin/polls/${pollId}/judges`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: judgeEmail, name: judgeName || undefined }),
                      });
                      if (response.ok) {
                        const data = await response.json();
                        setJudges([...judges, data.judge]);
                        setShowAddJudge(false);
                        setJudgeEmail('');
                        setJudgeName('');
                        setSuccess('Judge added');
                      } else setError('Failed');
                    } catch (err) { setError('Error'); }
                  }}
                  className="bg-[#1e40af]"
                >
                  Add Judge
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showEditTimeline && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-[#0F172A] mb-4">Adjust Poll Timeline</h3>
            <div className="space-y-4">
              <Input
                label="Start Time *"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <Input
                label="End Time *"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setShowEditTimeline(false)}>Cancel</Button>
                <Button onClick={handleUpdateTimeline} isLoading={submitting}>Update Timeline</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showTieBreaker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-[#0F172A] mb-4">Create Tie Breaker</h3>
            <div className="space-y-4">
              <Input
                label="Tie Breaker Name *"
                value={tieBreakerName}
                onChange={(e) => setTieBreakerName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Time *"
                  type="datetime-local"
                  value={tieBreakerStartTime}
                  onChange={(e) => setTieBreakerStartTime(e.target.value)}
                />
                <Input
                  label="End Time *"
                  type="datetime-local"
                  value={tieBreakerEndTime}
                  onChange={(e) => setTieBreakerEndTime(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-2">Select Teams *</label>
                <div className="max-h-48 overflow-y-auto border border-[#E2E8F0] rounded-lg p-2 space-y-2">
                  {teams.map((team) => (
                    <label key={team.team_id} className="flex items-center gap-2 p-2 hover:bg-[#F8FAFC] rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tiedTeamIds.includes(team.team_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTiedTeamIds([...tiedTeamIds, team.team_id]);
                          } else {
                            setTiedTeamIds(tiedTeamIds.filter(id => id !== team.team_id));
                          }
                        }}
                        className="w-4 h-4 text-[#4F46E5] rounded focus:ring-[#4F46E5]"
                      />
                      <span className="text-sm text-[#334155]">{team.team_name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-[#64748B] mt-1">Select at least 2 teams for the tie breaker.</p>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setShowTieBreaker(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!tieBreakerName || !tieBreakerStartTime || !tieBreakerEndTime || tiedTeamIds.length < 2) {
                      setError('Please fill all fields and select at least 2 teams');
                      return;
                    }
                    setSubmitting(true);
                    const token = localStorage.getItem('auth_token');
                    if (!token) return;
                    try {
                      const response = await fetch(`/api/v1/admin/polls/${pollId}/tie-breaker`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: tieBreakerName,
                          startTime: new Date(tieBreakerStartTime).toISOString(),
                          endTime: new Date(tieBreakerEndTime).toISOString(),
                          teamIds: tiedTeamIds
                        }),
                      });

                      if (response.ok) {
                        setSuccess('Tie breaker created successfully');
                        setShowTieBreaker(false);
                        // Refresh data to show new poll in list or redirect
                        router.push('/admin/polls');
                      } else {
                        const data = await response.json();
                        setError(data.error || 'Failed to create tie breaker');
                      }
                    } catch (err) {
                      setError('An error occurred');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  isLoading={submitting}
                >
                  Create Tie Breaker
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Other modals (Edit Poll, Edit Team, Reassign, etc.) would follow similar pattern. 
          For brevity in this refactor, I'm keeping the structure but using Card/Input where possible. 
          The logic remains identical. */}

      {showEditPoll && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl p-6 my-8">
            <h3 className="text-xl font-semibold text-[#0F172A] mb-4">Edit Poll Details</h3>
            <div className="space-y-4">
              <Input label="Poll Name *" value={editPollName} onChange={(e) => setEditPollName(e.target.value)} />
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Start Time *" type="datetime-local" value={editPollStartTime} onChange={(e) => setEditPollStartTime(e.target.value)} />
                <Input label="End Time *" type="datetime-local" value={editPollEndTime} onChange={(e) => setEditPollEndTime(e.target.value)} />
              </div>
              {/* Selects are not yet standard components, keeping native select with styling */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">Voting Mode *</label>
                  <select
                    value={editPollVotingMode}
                    onChange={(e) => setEditPollVotingMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  >
                    <option value="single">Single Vote</option>
                    <option value="multiple">Multiple Votes</option>
                    <option value="ranked">Ranked Voting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">Voting Permissions *</label>
                  <select
                    value={editPollVotingPermissions}
                    onChange={(e) => setEditPollVotingPermissions(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  >
                    <option value="voters_only">Voters Only</option>
                    <option value="judges_only">Judges Only</option>
                    <option value="voters_and_judges">Voters & Judges</option>
                  </select>
                </div>
              </div>

              {editPollVotingMode === 'ranked' && (
                <Input
                  label="Max Ranked Positions"
                  type="number"
                  value={editPollMaxRankedPositions}
                  onChange={(e) => setEditPollMaxRankedPositions(e.target.value)}
                  placeholder="e.g. 3 (Leave empty for unlimited)"
                />
              )}

              {editPollVotingPermissions === 'voters_and_judges' && (
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">Voting Sequence</label>
                  <select
                    value={editPollVotingSequence}
                    onChange={(e) => setEditPollVotingSequence(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  >
                    <option value="simultaneous">Simultaneous</option>
                    <option value="voters_first">Voters First (Judges later)</option>
                  </select>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Voter Weight"
                  type="number"
                  step="0.1"
                  value={editPollVoterWeight}
                  onChange={(e) => setEditPollVoterWeight(e.target.value)}
                />
                <Input
                  label="Judge Weight"
                  type="number"
                  step="0.1"
                  value={editPollJudgeWeight}
                  onChange={(e) => setEditPollJudgeWeight(e.target.value)}
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
                <h4 className="font-medium text-[#0F172A]">Settings</h4>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-[#0F172A]">Allow Self Vote</label>
                  <input
                    type="checkbox"
                    checked={editPollAllowSelfVote}
                    onChange={(e) => setEditPollAllowSelfVote(e.target.checked)}
                    className="w-5 h-5 text-[#4F46E5] rounded focus:ring-[#4F46E5]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-[#0F172A]">Require Team Name Gate</label>
                  <input
                    type="checkbox"
                    checked={editPollRequireTeamNameGate}
                    onChange={(e) => setEditPollRequireTeamNameGate(e.target.checked)}
                    className="w-5 h-5 text-[#4F46E5] rounded focus:ring-[#4F46E5]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-[#0F172A]">Public Results</label>
                  <input
                    type="checkbox"
                    checked={editPollIsPublicResults}
                    onChange={(e) => setEditPollIsPublicResults(e.target.checked)}
                    className="w-5 h-5 text-[#4F46E5] rounded focus:ring-[#4F46E5]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-[#0F172A]">Allow Vote Editing</label>
                  <input
                    type="checkbox"
                    checked={editPollAllowVoteEditing}
                    onChange={(e) => setEditPollAllowVoteEditing(e.target.checked)}
                    className="w-5 h-5 text-[#4F46E5] rounded focus:ring-[#4F46E5]"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-[#E2E8F0]">
                <Input
                  label="Min Voter Participation (%)"
                  type="number"
                  value={editPollMinVoterParticipation}
                  onChange={(e) => setEditPollMinVoterParticipation(e.target.value)}
                  placeholder="Optional"
                />
                <Input
                  label="Min Judge Participation (%)"
                  type="number"
                  value={editPollMinJudgeParticipation}
                  onChange={(e) => setEditPollMinJudgeParticipation(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              {/* ... other fields ... */}
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setShowEditPoll(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    // Logic copied from original
                    if (!editPollName.trim() || !editPollStartTime || !editPollEndTime) {
                      setError('Required fields missing'); return;
                    }
                    setSubmitting(true);
                    const token = localStorage.getItem('auth_token');
                    if (!token) return;
                    try {
                      const updateData: any = {
                        name: editPollName.trim(),
                        startTime: new Date(editPollStartTime).toISOString(),
                        endTime: new Date(editPollEndTime).toISOString(),
                        votingMode: editPollVotingMode,
                        votingPermissions: editPollVotingPermissions,
                        voterWeight: parseFloat(editPollVoterWeight) || 1.0,
                        judgeWeight: parseFloat(editPollJudgeWeight) || 1.0,
                        allowSelfVote: editPollAllowSelfVote,
                        requireTeamNameGate: editPollRequireTeamNameGate,
                        isPublicResults: editPollIsPublicResults,
                        allowVoteEditing: editPollAllowVoteEditing,
                        minVoterParticipation: editPollMinVoterParticipation ? parseInt(editPollMinVoterParticipation) : null,
                        minJudgeParticipation: editPollMinJudgeParticipation ? parseInt(editPollMinJudgeParticipation) : null,
                      };
                      if (editPollVotingMode === 'ranked') updateData.maxRankedPositions = editPollMaxRankedPositions ? parseInt(editPollMaxRankedPositions) : null;
                      if (editPollVotingPermissions === 'voters_and_judges') updateData.votingSequence = editPollVotingSequence;

                      const response = await fetch(`/api/v1/admin/polls/${pollId}`, {
                        method: 'PATCH',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(updateData),
                      });
                      if (response.ok) {
                        setSuccess('Poll updated');
                        setShowEditPoll(false);
                        fetchPollData(token);
                      } else setError('Failed');
                    } catch (err) { setError('Error'); } finally { setSubmitting(false); }
                  }}
                  isLoading={submitting}
                >
                  Update Poll
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showMigrateTeams && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl p-6 my-8">
            <h3 className="text-xl font-semibold text-[#0F172A] mb-4">Duplicate Teams to Another Poll</h3>
            <p className="text-sm text-[#64748B] mb-4">This will create copies of selected teams and their voters in the target poll. Teams and voters will remain in the current poll and can vote in both polls.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-2">Target Poll *</label>
                <select
                  value={targetPollId}
                  onChange={(e) => setTargetPollId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                >
                  <option value="">Select a poll...</option>
                  {availablePolls.map((p) => (
                    <option key={p.poll_id} value={p.poll_id}>
                      {p.name} ({new Date(p.start_time).toLocaleDateString()} - {new Date(p.end_time).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#64748B] mt-1">Select a poll in the same hackathon to duplicate teams to.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-2">Select Teams to Duplicate *</label>
                <div className="max-h-64 overflow-y-auto border border-[#E2E8F0] rounded-lg p-3 space-y-2">
                  {teams.length === 0 ? (
                    <p className="text-sm text-[#64748B] text-center py-4">No teams available</p>
                  ) : (
                    teams.map((team) => (
                      <label key={team.team_id} className="flex items-center gap-2 p-2 hover:bg-[#F8FAFC] rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTeamsToMigrate.includes(team.team_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTeamsToMigrate([...selectedTeamsToMigrate, team.team_id]);
                            } else {
                              setSelectedTeamsToMigrate(selectedTeamsToMigrate.filter(id => id !== team.team_id));
                            }
                          }}
                          className="w-4 h-4 text-[#4F46E5] rounded focus:ring-[#4F46E5]"
                        />
                        <span className="text-sm text-[#334155]">{team.team_name}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-[#64748B] mt-1">Select at least one team to duplicate. Their voters will also be duplicated.</p>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => {
                  setShowMigrateTeams(false);
                  setSelectedTeamsToMigrate([]);
                  setTargetPollId('');
                }}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!targetPollId) {
                      setError('Please select a target poll');
                      return;
                    }
                    if (selectedTeamsToMigrate.length === 0) {
                      setError('Please select at least one team to duplicate');
                      return;
                    }
                    setSubmitting(true);
                    setError('');
                    const token = localStorage.getItem('auth_token');
                    if (!token) return;
                    try {
                      const response = await fetch(`/api/v1/admin/polls/${pollId}/teams/migrate`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          targetPollId,
                          teamIds: selectedTeamsToMigrate
                        }),
                      });
                      const data = await response.json();
                      if (response.ok) {
                        setSuccess(`Successfully duplicated ${data.teams.length} team(s) and their voters to the target poll`);
                        setShowMigrateTeams(false);
                        setSelectedTeamsToMigrate([]);
                        setTargetPollId('');
                        fetchPollData(token);
                      } else {
                        setError(data.error || 'Failed to duplicate teams');
                      }
                    } catch (err) {
                      setError('An error occurred');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  isLoading={submitting}
                  className="bg-[#4F46E5] hover:bg-[#4338ca]"
                >
                  Duplicate Teams
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showMigrateTeams && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl p-6 my-8">
            <h3 className="text-xl font-semibold text-[#0F172A] mb-4">Duplicate Teams to Another Poll</h3>
            <p className="text-sm text-[#64748B] mb-4">This will create copies of selected teams and their voters in the target poll. Teams and voters will remain in the current poll and can vote in both polls.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-2">Target Poll *</label>
                <select
                  value={targetPollId}
                  onChange={(e) => setTargetPollId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                >
                  <option value="">Select a poll...</option>
                  {availablePolls.map((p) => (
                    <option key={p.poll_id} value={p.poll_id}>
                      {p.name} ({new Date(p.start_time).toLocaleDateString()} - {new Date(p.end_time).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#64748B] mt-1">Select a poll in the same hackathon to duplicate teams to.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-2">Select Teams to Duplicate *</label>
                <div className="max-h-64 overflow-y-auto border border-[#E2E8F0] rounded-lg p-3 space-y-2">
                  {teams.length === 0 ? (
                    <p className="text-sm text-[#64748B] text-center py-4">No teams available</p>
                  ) : (
                    teams.map((team) => (
                      <label key={team.team_id} className="flex items-center gap-2 p-2 hover:bg-[#F8FAFC] rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTeamsToMigrate.includes(team.team_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTeamsToMigrate([...selectedTeamsToMigrate, team.team_id]);
                            } else {
                              setSelectedTeamsToMigrate(selectedTeamsToMigrate.filter(id => id !== team.team_id));
                            }
                          }}
                          className="w-4 h-4 text-[#4F46E5] rounded focus:ring-[#4F46E5]"
                        />
                        <span className="text-sm text-[#334155]">{team.team_name}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-[#64748B] mt-1">Select at least one team to duplicate. Their voters will also be duplicated.</p>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => {
                  setShowMigrateTeams(false);
                  setSelectedTeamsToMigrate([]);
                  setTargetPollId('');
                }}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!targetPollId) {
                      setError('Please select a target poll');
                      return;
                    }
                    if (selectedTeamsToMigrate.length === 0) {
                      setError('Please select at least one team to duplicate');
                      return;
                    }
                    setSubmitting(true);
                    setError('');
                    const token = localStorage.getItem('auth_token');
                    if (!token) return;
                    try {
                      const response = await fetch(`/api/v1/admin/polls/${pollId}/teams/migrate`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          targetPollId,
                          teamIds: selectedTeamsToMigrate
                        }),
                      });
                      const data = await response.json();
                      if (response.ok) {
                        setSuccess(`Successfully duplicated ${data.teams.length} team(s) and their voters to the target poll`);
                        setShowMigrateTeams(false);
                        setSelectedTeamsToMigrate([]);
                        setTargetPollId('');
                        fetchPollData(token);
                      } else {
                        setError(data.error || 'Failed to duplicate teams');
                      }
                    } catch (err) {
                      setError('An error occurred');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  isLoading={submitting}
                  className="bg-[#4F46E5] hover:bg-[#4338ca]"
                >
                  Duplicate Teams
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showEditTeam && editingTeam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-[#0F172A] mb-4">Edit Team</h3>
            <div className="space-y-4">
              <Input label="Team Name *" value={editTeamName} onChange={(e) => setEditTeamName(e.target.value)} />
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setShowEditTeam(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!editTeamName.trim()) { setError('Name required'); return; }
                    setSubmitting(true);
                    const token = localStorage.getItem('auth_token');
                    if (!token) return;
                    try {
                      const response = await fetch(`/api/v1/admin/polls/${pollId}/teams/${editingTeam.team_id}`, {
                        method: 'PATCH',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ teamName: editTeamName.trim() }),
                      });
                      if (response.ok) {
                        setSuccess('Team updated');
                        setShowEditTeam(false);
                        fetchPollData(token);
                      } else setError('Failed');
                    } catch (err) { setError('Error'); } finally { setSubmitting(false); }
                  }}
                  isLoading={submitting}
                >
                  Update Team
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showReassignVoter && reassigningVoter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-[#0F172A] mb-4">Reassign Voter</h3>
            <div className="space-y-4">
              <p className="text-sm text-[#64748B]">Reassign <strong>{reassigningVoter.email}</strong></p>
              <div className="relative team-search-dropdown">
                <Input
                  label="New Team *"
                  value={reassignTeamSearchQuery}
                  onChange={(e) => {
                    const query = e.target.value;
                    setReassignTeamSearchQuery(query);
                    setReassignTeamSearchOpen(true);
                    const exactMatch = teams.find(t => t.team_name.toLowerCase() === query.toLowerCase());
                    if (exactMatch) {
                      setSelectedReassignTeam(exactMatch.team_id);
                      setReassignTeamSearchQuery(exactMatch.team_name);
                      setReassignTeamSearchOpen(false);
                    }
                  }}
                  onFocus={() => setReassignTeamSearchOpen(true)}
                  placeholder="Search team"
                />
                {reassignTeamSearchOpen && teams.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg max-h-60 overflow-auto">
                    {teams.filter(t => !reassignTeamSearchQuery || t.team_name.toLowerCase().includes(reassignTeamSearchQuery.toLowerCase()))
                      .map(team => (
                        <button
                          key={team.team_id}
                          onClick={() => {
                            setSelectedReassignTeam(team.team_id);
                            setReassignTeamSearchQuery(team.team_name);
                            setReassignTeamSearchOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-[#F8FAFC]"
                        >
                          {team.team_name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setShowReassignVoter(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!selectedReassignTeam) { setError('Select team'); return; }
                    setSubmitting(true);
                    const token = localStorage.getItem('auth_token');
                    if (!token) return;
                    try {
                      const response = await fetch(`/api/v1/admin/polls/${pollId}/voters/${reassigningVoter.tokenId}/reassign`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ newTeamId: selectedReassignTeam }),
                      });
                      if (response.ok) {
                        setSuccess('Reassigned');
                        setShowReassignVoter(false);
                        fetchPollData(token);
                      } else setError('Failed');
                    } catch (err) { setError('Error'); } finally { setSubmitting(false); }
                  }}
                  isLoading={submitting}
                >
                  Reassign
                </Button>
              </div>
            </div>
          </Card>
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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-[#64748B]">Loading...</div>
      </div>
    }>
      <PollManagementPageContent />
    </Suspense>
  );
}
