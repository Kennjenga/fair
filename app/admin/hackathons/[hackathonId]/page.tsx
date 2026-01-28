'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layouts';
import { Button, Card, Badge, Input, DateTimeInput } from '@/components/ui';
import { Copy, ExternalLink, Users, FileText, Search, ChevronLeft, ChevronRight, Edit2, Trash2, X, Check, Upload, FileSpreadsheet, ChevronDown, ChevronUp, Download, Eye, Mail, Phone, User, Github, Calendar, Building2 } from 'lucide-react';

/**
 * Shape of a single form field as returned by the admin form API.
 * Using an explicit interface here keeps the hackathon detail page
 * type-safe without requiring consumers to know about database details.
 */
interface AdminFormField {
  field_id: string;
  field_name: string;
  field_type: string;
  field_label: string;
  field_description: string | null;
  is_required: boolean;
  visibility_scope: string;
  form_key?: string; // Form key (team_formation, project_details, default)
}


function HackathonDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const hackathonId = params.hackathonId as string;

  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [hackathon, setHackathon] = useState<any>(null);
  // All configured participation / submission fields for this hackathon, grouped by form_key.
  const [formFields, setFormFields] = useState<AdminFormField[]>([]);
  // Track which forms exist (team_formation, project_details, etc.)
  const [formKeys, setFormKeys] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionsPagination, setSubmissionsPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [submissionsSearch, setSubmissionsSearch] = useState('');
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'form' | 'teams' | 'submissions' | 'polls'>('overview');
  const [autoStatusEnabled, setAutoStatusEnabled] = useState(true); // Default to automatic
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Polls state
  const [polls, setPolls] = useState<any[]>([]);
  const [pollsLoading, setPollsLoading] = useState(false);
  const [pollsSearch, setPollsSearch] = useState('');
  const [pollsFilter, setPollsFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('all');
  
  // Poll management state
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<any>(null);
  const [pollTeams, setPollTeams] = useState<any[]>([]);
  const [pollTokens, setPollTokens] = useState<any[]>([]);
  const [pollJudges, setPollJudges] = useState<any[]>([]);
  const [pollResults, setPollResults] = useState<any>(null);
  const [pollManagementLoading, setPollManagementLoading] = useState(false);
  const [pollManagementTab, setPollManagementTab] = useState<'overview' | 'teams' | 'voters' | 'judges' | 'results'>('overview');
  
  // Poll management modals and forms
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showRegisterVoters, setShowRegisterVoters] = useState(false);
  const [showEditTimeline, setShowEditTimeline] = useState(false);
  const [showEditPoll, setShowEditPoll] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [showReassignVoter, setShowReassignVoter] = useState(false);
  const [showAddJudge, setShowAddJudge] = useState(false);
  const [pollSubmitting, setPollSubmitting] = useState(false);
  const [pollError, setPollError] = useState('');
  const [pollSuccess, setPollSuccess] = useState('');
  
  // Poll management form states
  const [pollTeamName, setPollTeamName] = useState('');
  const [pollEditTeamName, setPollEditTeamName] = useState('');
  const [pollVotersList, setPollVotersList] = useState([{ email: '', teamName: '' }]);
  const [pollJudgeEmail, setPollJudgeEmail] = useState('');
  const [pollJudgeName, setPollJudgeName] = useState('');
  const [pollStartTime, setPollStartTime] = useState('');
  const [pollEndTime, setPollEndTime] = useState('');
  const [pollSelectedReassignTeam, setPollSelectedReassignTeam] = useState('');
  const [pollEditingTeam, setPollEditingTeam] = useState<any>(null);
  const [pollReassigningVoter, setPollReassigningVoter] = useState<any>(null);
  
  // Poll edit form states
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
  
  // Poll search and filter states
  const [pollTeamsSearch, setPollTeamsSearch] = useState('');
  const [pollVotersSearch, setPollVotersSearch] = useState('');
  const [pollVotersFilter, setPollVotersFilter] = useState<'all' | 'voted' | 'not_voted'>('all');
  const [pollTeamsFilter, setPollTeamsFilter] = useState<'all' | 'with_members' | 'no_members'>('all');
  
  // Team search dropdown states
  const [pollTeamSearchOpen, setPollTeamSearchOpen] = useState<{ [key: number]: boolean }>({});
  const [pollTeamSearchQuery, setPollTeamSearchQuery] = useState<{ [key: number]: string }>({});
  const [pollReassignTeamSearchOpen, setPollReassignTeamSearchOpen] = useState(false);
  const [pollReassignTeamSearchQuery, setPollReassignTeamSearchQuery] = useState('');
  
  // Team CSV upload state
  const [uploadingTeams, setUploadingTeams] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  
  // Teams state
  const [teams, setTeams] = useState<any[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsSearch, setTeamsSearch] = useState('');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [expandedPollTeamId, setExpandedPollTeamId] = useState<string | null>(null);
  const [teamFormData, setTeamFormData] = useState({
    teamName: '',
    teamDescription: '',
    teamMembers: [{ email: '', firstName: '', lastName: '', phone: '', role: '', isLead: false }],
    projectName: '',
    projectDetails: '',
    problemStatement: '',
    solution: '',
    githubLink: '',
    liveLink: '',
  });
  
  // Form field expansion state (track which forms have expanded fields)
  const [expandedForms, setExpandedForms] = useState<Set<string>>(new Set());

  /**
   * Local state for template-based form creation.
   * Users can only create forms from predefined templates (Team Formation, Project Details).
   */
  const [creatingField, setCreatingField] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<Partial<AdminFormField> | null>(null);
  const [selectedFormKey, setSelectedFormKey] = useState<string>('team_formation');

  // Read tab from URL parameter on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'form', 'teams', 'submissions', 'polls'].includes(tabParam)) {
      setActiveTab(tabParam as 'overview' | 'form' | 'teams' | 'submissions' | 'polls');
    }
  }, [searchParams]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }

    const parsed = JSON.parse(adminData);
    setAdmin(parsed);

    fetchHackathonData(token);
  }, [hackathonId, router]);

  // Refresh polls when polls tab becomes active
  useEffect(() => {
    if (activeTab === 'polls') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        fetchPolls(token);
      }
    }
  }, [activeTab, hackathonId]);

  /**
   * Fetch submissions with pagination and search
   */
  const fetchSubmissions = async (token: string, page: number, search: string) => {
    try {
      setSubmissionsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '10',
      });
      if (search.trim()) {
        params.append('search', search.trim());
      }

      const submissionsRes = await fetch(
        `/api/v1/admin/hackathons/${hackathonId}/submissions?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (submissionsRes.ok) {
        const data = await submissionsRes.json();
        setSubmissions(data.submissions || []);
        setSubmissionsPagination(data.pagination || submissionsPagination);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const fetchHackathonData = async (token: string) => {
    try {
      // Fetch hackathon details
      const hackathonRes = await fetch(`/api/v1/admin/hackathons/${hackathonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (hackathonRes.ok) {
        const data = await hackathonRes.json();
        setHackathon(data.hackathon);
        
        // Automatically update status based on dates (if needed)
        // This ensures status is current when viewing the hackathon
        if (data.hackathon) {
          try {
            // Call auto-update endpoint (or trigger it server-side)
            // For now, we'll just ensure the status is correct on the client
            const now = new Date();
            const votingClosesAt = data.hackathon.voting_closes_at ? new Date(data.hackathon.voting_closes_at) : null;
            const endDate = data.hackathon.end_date ? new Date(data.hackathon.end_date) : null;
            
            // Check if status needs updating (client-side check for UI feedback)
            if (endDate && now >= endDate && data.hackathon.status !== 'finalized') {
              // Status should be finalized - will be handled server-side on next status update
            } else if (votingClosesAt && now >= votingClosesAt && data.hackathon.status === 'live') {
              // Status should be closed - will be handled server-side on next status update
            }
          } catch (err) {
            // Ignore auto-update errors on client
            console.warn('Could not check status auto-update:', err);
          }
        }
      }

      // Fetch form fields
      const formRes = await fetch(`/api/v1/admin/hackathons/${hackathonId}/form`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (formRes.ok) {
        const data = await formRes.json();
        const fields = (data.fields || []) as AdminFormField[];
        setFormFields(fields);
        // Extract unique form_keys to show form grouping
        const uniqueFormKeys = Array.from(new Set(fields.map((f: AdminFormField) => f.form_key || 'default')));
        setFormKeys(uniqueFormKeys.sort());
      }

      // Fetch submissions (initial load - first page)
      await fetchSubmissions(token, 1, '');
      
      // Fetch polls for this hackathon
      await fetchPolls(token);
      
      // Fetch teams for this hackathon
      await fetchTeams(token);
    } catch (error) {
      console.error('Failed to fetch hackathon data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Fetch polls for the hackathon
   */
  const fetchPolls = async (token: string) => {
    try {
      setPollsLoading(true);
      const pollsRes = await fetch(`/api/v1/admin/hackathons/${hackathonId}/polls`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (pollsRes.ok) {
        const data = await pollsRes.json();
        setPolls(data.polls || []);
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setPollsLoading(false);
    }
  };
  
  /**
   * Fetch poll management data for a specific poll
   */
  const fetchPollManagementData = async (pollId: string) => {
    try {
      setPollManagementLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
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
      
      const pollData = await pollRes.json();
      const teamsData = await teamsRes.json();
      const tokensData = await tokensRes.json();
      const judgesData = await judgesRes.json();
      
      if (resultsRes && resultsRes.ok) {
        const resultsData = await resultsRes.json();
        setPollResults(resultsData);
      }
      
      setSelectedPoll(pollData.poll);
      const teams = teamsData.teams || [];
      
      // Debug: Log first team to see metadata structure
      if (teams.length > 0) {
        console.log('Debug: First poll team data:', {
          team_name: teams[0].team_name,
          hasMetadata: !!teams[0].metadata,
          metadataType: typeof teams[0].metadata,
          metadata: teams[0].metadata,
        });
      }
      
      setPollTeams(teams);
      setPollTokens(tokensData.tokens || []);
      setPollJudges(judgesData.judges || []);
    } catch (error) {
      console.error('Error fetching poll management data:', error);
    } finally {
      setPollManagementLoading(false);
    }
  };
  
  /**
   * Handle poll selection for management
   */
  const handleSelectPoll = (pollId: string) => {
    setSelectedPollId(pollId);
    setPollManagementTab('overview');
    fetchPollManagementData(pollId);
  };
  
  /**
   * Handle going back to polls list
   */
  const handleBackToPollsList = () => {
    setSelectedPollId(null);
    setSelectedPoll(null);
    setPollTeams([]);
    setPollTokens([]);
    setPollJudges([]);
    setPollResults(null);
  };
  
  /**
   * Poll Management Functions
   */
  const handlePollAddTeam = async () => {
    if (!pollTeamName.trim()) {
      setPollError('Team name is required');
      return;
    }
    
    if (!selectedPollId) return;
    
    setPollSubmitting(true);
    setPollError('');
    setPollSuccess('');
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch(`/api/v1/admin/polls/${selectedPollId}/teams`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamName: pollTeamName.trim() }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setPollError(data.error || 'Failed to add team');
        return;
      }
      
      setPollSuccess('Team added successfully!');
      setPollTeamName('');
      setShowAddTeam(false);
      await fetchPollManagementData(selectedPollId);
    } catch (err) {
      setPollError('An error occurred. Please try again.');
    } finally {
      setPollSubmitting(false);
    }
  };
  
  const handlePollRegisterVoters = async () => {
    if (!selectedPollId) return;
    
    const validVoters = pollVotersList.filter(v => v.email.trim() && v.teamName.trim());
    if (validVoters.length === 0) {
      setPollError('Please add at least one voter with email and team name');
      return;
    }
    
    setPollSubmitting(true);
    setPollError('');
    setPollSuccess('');
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch(`/api/v1/admin/polls/${selectedPollId}/voters`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voters: validVoters }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setPollError(data.error || 'Failed to register voters');
        return;
      }
      
      setPollSuccess(`${validVoters.length} voter(s) registered successfully!`);
      setPollVotersList([{ email: '', teamName: '' }]);
      setPollTeamSearchQuery({});
      setPollTeamSearchOpen({});
      setShowRegisterVoters(false);
      await fetchPollManagementData(selectedPollId);
    } catch (err) {
      setPollError('An error occurred. Please try again.');
    } finally {
      setPollSubmitting(false);
    }
  };
  
  const handlePollAddJudge = async () => {
    if (!selectedPollId) return;
    
    if (!pollJudgeEmail.trim()) {
      setPollError('Email is required');
      return;
    }
    
    setPollSubmitting(true);
    setPollError('');
    setPollSuccess('');
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch(`/api/v1/admin/polls/${selectedPollId}/judges`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: pollJudgeEmail, name: pollJudgeName || undefined }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setPollError(data.error || 'Failed to add judge');
        return;
      }
      
      setPollSuccess('Judge added successfully!');
      setPollJudgeEmail('');
      setPollJudgeName('');
      setShowAddJudge(false);
      await fetchPollManagementData(selectedPollId);
    } catch (err) {
      setPollError('An error occurred. Please try again.');
    } finally {
      setPollSubmitting(false);
    }
  };
  
  const handlePollUpdateTimeline = async () => {
    if (!selectedPollId) return;
    
    if (!pollStartTime || !pollEndTime) {
      setPollError('Start time and end time are required');
      return;
    }
    
    const startDate = new Date(pollStartTime);
    const endDate = new Date(pollEndTime);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setPollError('Invalid date format');
      return;
    }
    
    if (endDate <= startDate) {
      setPollError('End time must be after start time');
      return;
    }
    
    setPollSubmitting(true);
    setPollError('');
    setPollSuccess('');
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch(`/api/v1/admin/polls/${selectedPollId}`, {
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
        setPollError(data.error || 'Failed to update timeline');
        return;
      }
      
      setPollSuccess('Timeline updated successfully!');
      setShowEditTimeline(false);
      await fetchPollManagementData(selectedPollId);
    } catch (err) {
      setPollError('An error occurred. Please try again.');
    } finally {
      setPollSubmitting(false);
    }
  };
  
  const handlePollEditPoll = async () => {
    if (!selectedPollId) return;
    
    if (!editPollName.trim()) {
      setPollError('Poll name is required');
      return;
    }
    
    setPollSubmitting(true);
    setPollError('');
    setPollSuccess('');
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const startDate = new Date(editPollStartTime);
      const endDate = new Date(editPollEndTime);
      
      const updateData: any = {
        name: editPollName,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        votingMode: editPollVotingMode,
        votingPermissions: editPollVotingPermissions,
        voterWeight: parseFloat(editPollVoterWeight),
        judgeWeight: parseFloat(editPollJudgeWeight),
        allowSelfVote: editPollAllowSelfVote,
        requireTeamNameGate: editPollRequireTeamNameGate,
        isPublicResults: editPollIsPublicResults,
        allowVoteEditing: editPollAllowVoteEditing,
        votingSequence: editPollVotingSequence,
        minVoterParticipation: editPollMinVoterParticipation ? parseInt(editPollMinVoterParticipation) : null,
        minJudgeParticipation: editPollMinJudgeParticipation ? parseInt(editPollMinJudgeParticipation) : null,
        maxRankedPositions: editPollVotingMode === 'ranked' && editPollMaxRankedPositions
          ? parseInt(editPollMaxRankedPositions, 10)
          : null,
      };
      
      const response = await fetch(`/api/v1/admin/polls/${selectedPollId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setPollError(data.error || 'Failed to update poll');
        return;
      }
      
      setPollSuccess('Poll updated successfully!');
      setShowEditPoll(false);
      await fetchPollManagementData(selectedPollId);
    } catch (err) {
      setPollError('An error occurred. Please try again.');
    } finally {
      setPollSubmitting(false);
    }
  };
  
  const addPollVoterRow = () => {
    setPollVotersList([...pollVotersList, { email: '', teamName: '' }]);
  };
  
  const removePollVoterRow = (index: number) => {
    setPollVotersList(pollVotersList.filter((_, i) => i !== index));
  };
  
  const updatePollVoterRow = (index: number, field: 'email' | 'teamName', value: string) => {
    const updated = [...pollVotersList];
    updated[index][field] = value;
    setPollVotersList(updated);
    if (field === 'teamName') {
      setPollTeamSearchQuery({ ...pollTeamSearchQuery, [index]: value });
    }
  };
  
  // Initialize timeline when poll is selected
  useEffect(() => {
    if (selectedPoll) {
      const start = new Date(selectedPoll.start_time);
      const end = new Date(selectedPoll.end_time);
      setPollStartTime(start.toISOString().slice(0, 16));
      setPollEndTime(end.toISOString().slice(0, 16));
    }
  }, [selectedPoll]);
  
  // Handle click outside for team search dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.team-search-dropdown')) {
        setPollTeamSearchOpen({});
        setPollReassignTeamSearchOpen(false);
      }
    };
    
    const hasOpenDropdown = Object.values(pollTeamSearchOpen).some(open => open) || pollReassignTeamSearchOpen;
    
    if (hasOpenDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => { };
  }, [pollTeamSearchOpen, pollReassignTeamSearchOpen]);
  
  /**
   * Fetch teams for the hackathon
   */
  const fetchTeams = async (token: string) => {
    try {
      setTeamsLoading(true);
      const params = new URLSearchParams({
        page: '1',
        pageSize: '100', // Get all teams for the tab view
      });
      if (teamsSearch.trim()) {
        params.append('search', teamsSearch.trim());
      }
      
      const teamsRes = await fetch(
        `/api/v1/admin/hackathons/${hackathonId}/teams?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (teamsRes.ok) {
        const data = await teamsRes.json();
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setTeamsLoading(false);
    }
  };
  
  /**
   * Pull teams from form submissions
   */
  const pullTeamsFromForm = async () => {
    try {
      setTeamsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      // Fetch all submissions with team_formation form
      const submissionsRes = await fetch(
        `/api/v1/admin/hackathons/${hackathonId}/submissions?pageSize=1000&form=team_formation`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (submissionsRes.ok) {
        const data = await submissionsRes.json();
        // Teams are automatically extracted from submissions, so just refresh
        await fetchTeams(token);
        setUploadSuccess('Teams pulled from form submissions successfully');
        setTimeout(() => setUploadSuccess(''), 5000);
      }
    } catch (error) {
      console.error('Error pulling teams from form:', error);
      setUploadError('Failed to pull teams from form submissions');
    } finally {
      setTeamsLoading(false);
    }
  };
  
  /**
   * Create a new team manually
   */
  const createTeam = async () => {
    try {
      setCreatingTeam(true);
      setUploadError('');
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      // Validate required fields
      if (!teamFormData.teamName.trim()) {
        setUploadError('Team name is required');
        setCreatingTeam(false);
        return;
      }
      
      if (!teamFormData.teamMembers || teamFormData.teamMembers.length === 0) {
        setUploadError('At least one team member is required');
        setCreatingTeam(false);
        return;
      }
      
      // Validate team members
      for (let i = 0; i < teamFormData.teamMembers.length; i++) {
        const member = teamFormData.teamMembers[i];
        if (!member.email || !member.firstName || !member.lastName) {
          setUploadError(`Team member ${i + 1} is missing required fields (email, first name, last name)`);
          setCreatingTeam(false);
          return;
        }
      }
      
      // Check if at least one member is marked as lead
      const hasLead = teamFormData.teamMembers.some(m => m.isLead);
      if (!hasLead) {
        // Mark first member as lead if none is marked
        teamFormData.teamMembers[0].isLead = true;
      }
      
      // Create submission with team formation data
      const submissionData = {
        team_name: teamFormData.teamName,
        team_description: teamFormData.teamDescription,
        team_members: teamFormData.teamMembers.map(m => ({
          email: m.email,
          firstName: m.firstName,
          lastName: m.lastName,
          phone: m.phone || '',
          role: m.role || '',
          isLead: m.isLead,
        })),
        project_name: teamFormData.projectName || undefined,
        project_details: teamFormData.projectDetails || undefined,
        problem_statement: teamFormData.problemStatement || undefined,
        solution: teamFormData.solution || undefined,
        github_link: teamFormData.githubLink || undefined,
        live_link: teamFormData.liveLink || undefined,
      };
      
      const response = await fetch(
        `/api/v1/public/hackathons/${hackathonId}/submit?form=team_formation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(submissionData),
        }
      );
      
      if (response.ok) {
        setUploadSuccess('Team created successfully');
        setShowCreateTeam(false);
        setTeamFormData({
          teamName: '',
          teamDescription: '',
          teamMembers: [{ email: '', firstName: '', lastName: '', phone: '', role: '', isLead: false }],
          projectName: '',
          projectDetails: '',
          problemStatement: '',
          solution: '',
          githubLink: '',
          liveLink: '',
        });
        await fetchTeams(token);
        setTimeout(() => setUploadSuccess(''), 5000);
      } else {
        const error = await response.json();
        setUploadError(error.error || 'Failed to create team');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      setUploadError('Failed to create team. Please try again.');
    } finally {
      setCreatingTeam(false);
    }
  };
  
  /**
   * Get poll status based on current time
   */
  const getPollStatus = (poll: any) => {
    const now = new Date();
    const startTime = new Date(poll.start_time);
    const endTime = new Date(poll.end_time);
    
    if (startTime <= now && endTime >= now) return 'active';
    if (endTime < now) return 'ended';
    return 'upcoming';
  };
  
  /**
   * Filter polls based on search and status filter
   */
  const filteredPolls = polls.filter((poll) => {
    // Filter by status
    if (pollsFilter !== 'all') {
      const status = getPollStatus(poll);
      if (status !== pollsFilter) return false;
    }
    
    // Filter by search query
    if (pollsSearch) {
      const query = pollsSearch.toLowerCase();
      return poll.name.toLowerCase().includes(query);
    }
    
    return true;
  });

  /**
   * Automatically update status based on dates (if auto mode is enabled)
   */
  const autoUpdateStatus = async () => {
    try {
      setUpdatingStatus(true);
      setStatusError('');
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(
        `/api/v1/admin/hackathons/${hackathonId}/auto-update-status`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.hackathon) {
          setHackathon(data.hackathon);
        }
      }
    } catch (error) {
      console.error('Error auto-updating status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  /**
   * Update hackathon status with date validation.
   * Prevents status changes when dates have passed (e.g., can't change to 'live'
   * if voting_closes_at has passed, can't change from 'finalized', etc.)
   */
  const updateStatus = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      setStatusError('');
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/v1/admin/hackathons/${hackathonId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setHackathon(data.hackathon);
        setStatusError('');
        // Refresh hackathon data to get updated status
        if (token) {
          await fetchHackathonData(token);
        }
      } else {
        const error = await response.json();
        // Show validation error from server (e.g., "Cannot change to 'live' because voting closed at...")
        setStatusError(error.error || error.details || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setStatusError('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Auto-update status on mount and when dates change (if auto mode enabled)
  useEffect(() => {
    if (hackathon && autoStatusEnabled) {
      // Initial check
      autoUpdateStatus();
      
      // Set up interval to check status every minute
      const interval = setInterval(() => {
        autoUpdateStatus();
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hackathon?.voting_closes_at, hackathon?.end_date, autoStatusEnabled, hackathonId]);

  /**
   * Start editing a form field
   */
  const handleStartEdit = (field: AdminFormField) => {
    setEditingFieldId(field.field_id);
    setEditingField({
      field_label: field.field_label,
      field_description: field.field_description,
      is_required: field.is_required,
    });
  };

  /**
   * Cancel editing
   */
  const handleCancelEdit = () => {
    setEditingFieldId(null);
    setEditingField(null);
  };

  /**
   * Save edited field
   */
  const handleSaveEdit = async (fieldId: string) => {
    if (!editingField) return;

    try {
      setFormError('');
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch(
        `/api/v1/admin/hackathons/${hackathonId}/form`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fieldId,
            fieldLabel: editingField.field_label,
            fieldDescription: editingField.field_description,
            isRequired: editingField.is_required,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        // Update the field in the list
        setFormFields((previous) =>
          previous.map((f) =>
            f.field_id === fieldId ? (data.field as AdminFormField) : f
          )
        );
        setEditingFieldId(null);
        setEditingField(null);
      } else {
        const error = await response.json();
        setFormError(error.error || 'Failed to update field');
      }
    } catch (error) {
      console.error('Error updating field:', error);
      setFormError('Failed to update field. Please try again.');
    }
  };

  /**
   * Delete a form field
   */
  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field? This action cannot be undone.')) {
        return;
      }

    try {
      setFormError('');
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch(
        `/api/v1/admin/hackathons/${hackathonId}/form?fieldId=${fieldId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        // Remove the field from the list
        setFormFields((previous) => previous.filter((f) => f.field_id !== fieldId));
        // Refresh form keys if needed
        const remainingFields = formFields.filter((f) => f.field_id !== fieldId);
        const remainingFormKeys = Array.from(
          new Set(remainingFields.map((f) => f.form_key || 'default'))
        );
        setFormKeys(remainingFormKeys.sort());
      } else {
        const error = await response.json();
        setFormError(error.error || 'Failed to delete field');
      }
    } catch (error) {
      console.error('Error deleting field:', error);
      setFormError('Failed to delete field. Please try again.');
    }
  };

  /**
   * Copy submission link for a form
   */
  const copyFormSubmissionLink = async (formKey: string) => {
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/hackathons/${hackathonId}/submit${formKey !== 'default' ? `?form=${formKey}` : ''}`;
    try {
      await navigator.clipboard.writeText(link);
      alert('Submission link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link. Please copy manually: ' + link);
    }
  };

  /**
   * Toggle form field expansion
   */
  const toggleFormExpansion = (formKey: string) => {
    setExpandedForms((prev) => {
      const next = new Set(prev);
      if (next.has(formKey)) {
        next.delete(formKey);
      } else {
        next.add(formKey);
      }
      return next;
    });
  };

  /**
   * Delete entire form (all fields for a form_key)
   */
  const handleDeleteForm = async (formKey: string) => {
    const formLabel =
      formKey === 'team_formation'
        ? 'Team Formation Form'
        : formKey === 'project_details'
          ? 'Project Details Form'
          : 'Default Form';

    if (!confirm(`Are you sure you want to delete the entire "${formLabel}"? This will remove all ${formFields.filter((f) => (f.form_key || 'default') === formKey).length} field(s) and cannot be undone.`)) {
      return;
    }

    try {
      setFormError('');
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch(
        `/api/v1/admin/hackathons/${hackathonId}/form?formKey=${formKey}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        // Remove all fields for this form from the list
        setFormFields((previous) => previous.filter((f) => (f.form_key || 'default') !== formKey));
        // Update form keys
        const remainingFields = formFields.filter((f) => (f.form_key || 'default') !== formKey);
        const remainingFormKeys = Array.from(
          new Set(remainingFields.map((f) => f.form_key || 'default'))
        );
        setFormKeys(remainingFormKeys.sort());
        // Remove from expanded forms
        setExpandedForms((prev) => {
          const next = new Set(prev);
          next.delete(formKey);
          return next;
        });
      } else {
        const error = await response.json();
        setFormError(error.error || 'Failed to delete form');
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      setFormError('Failed to delete form. Please try again.');
    }
  };

  /**
   * Download CSV template
   */
  const downloadCsvTemplate = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setUploadError('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(
        `/api/v1/admin/hackathons/${hackathonId}/teams/csv-template`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `team-import-template-${hackathonId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        setUploadError(error.error || 'Failed to download template');
      }
    } catch (error: any) {
      console.error('Error downloading CSV template:', error);
      setUploadError('Failed to download template. Please try again.');
    }
  };



  // Keep sidebar visible during loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex">
        <Sidebar user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading hackathon...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex">
        <Sidebar user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Hackathon not found</p>
              <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-700">
                ← Back to Previous Page
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header - Simplified */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-[#4F46E5] hover:text-[#6366F1] mb-4 transition-colors font-medium"
            >
              ← Back to Previous Page
            </button>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#0F172A] mb-2">{hackathon.name}</h1>
                <div className="flex items-center gap-3">
                  <Badge variant={
                    hackathon.status === 'live' ? 'success' :
                    hackathon.status === 'draft' ? 'warning' :
                    hackathon.status === 'closed' ? 'secondary' : 'secondary'
                  }>
                    {hackathon.status}
                  </Badge>
                  {hackathon.template_name && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                      {hackathon.template_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs - Enhanced Design */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-2 mb-6">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2.5 font-semibold text-sm rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white shadow-md'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('form')}
                className={`px-4 py-2.5 font-semibold text-sm rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'form'
                    ? 'bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white shadow-md'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                <FileText className="w-4 h-4" />
                Forms ({formKeys.length})
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`px-4 py-2.5 font-semibold text-sm rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'teams'
                    ? 'bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white shadow-md'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                <Users className="w-4 h-4" />
                Teams
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-4 py-2.5 font-semibold text-sm rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'submissions'
                    ? 'bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white shadow-md'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                Submissions ({submissions.length})
              </button>
              <button
                onClick={() => setActiveTab('polls')}
                className={`px-4 py-2.5 font-semibold text-sm rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'polls'
                    ? 'bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white shadow-md'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                🗳️ Polls ({polls.length})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Overview Section with Details */}
              <Card className="bg-gradient-to-br from-white to-[#F8FAFC] border border-[#E2E8F0]">
                <h3 className="text-xl font-semibold text-[#0F172A] mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-[#4F46E5] to-[#6366F1] rounded-full"></div>
                  Overview
                </h3>
                
                {/* Description */}
                {hackathon.description && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-2">Description</h4>
                    <p className="text-[#334155] leading-relaxed">{hackathon.description}</p>
                  </div>
                )}

                {/* Hackathon Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {hackathon.start_date && (
                    <div className="p-4 bg-white rounded-lg border border-[#E2E8F0]">
                      <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">Start Date</p>
                      <p className="text-sm font-medium text-[#0F172A]">{new Date(hackathon.start_date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                  )}
                  {hackathon.end_date && (
                    <div className="p-4 bg-white rounded-lg border border-[#E2E8F0]">
                      <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">End Date</p>
                      <p className="text-sm font-medium text-[#0F172A]">{new Date(hackathon.end_date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                  )}
                  {hackathon.voting_closes_at && (
                    <div className="p-4 bg-white rounded-lg border border-[#E2E8F0]">
                      <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">Voting Closes</p>
                      <p className="text-sm font-medium text-[#0F172A]">{new Date(hackathon.voting_closes_at).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                  )}
                  {hackathon.submission_deadline && (
                    <div className="p-4 bg-white rounded-lg border border-[#E2E8F0]">
                      <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">Submission Deadline</p>
                      <p className="text-sm font-medium text-[#0F172A]">{new Date(hackathon.submission_deadline).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                  )}
                  {hackathon.evaluation_deadline && (
                    <div className="p-4 bg-white rounded-lg border border-[#E2E8F0]">
                      <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">Evaluation Deadline</p>
                      <p className="text-sm font-medium text-[#0F172A]">{new Date(hackathon.evaluation_deadline).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Status Management */}
              <Card className="bg-white border border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-[#0F172A] flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-[#4F46E5] to-[#6366F1] rounded-full"></div>
                    Status Management
                  </h3>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-[#64748B]">
                      <input
                        type="checkbox"
                        checked={autoStatusEnabled}
                        onChange={(e) => setAutoStatusEnabled(e.target.checked)}
                        className="w-4 h-4 text-[#4F46E5] border-gray-300 rounded focus:ring-[#4F46E5]"
                      />
                      <span>Automatic</span>
                    </label>
                  </div>
                </div>

                {/* Show validation error if status change was rejected */}
                {statusError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {statusError}
                  </div>
                )}

                {/* Current Status Display */}
                <div className="mb-4 p-4 bg-gradient-to-r from-[#F8FAFC] to-white rounded-lg border border-[#E2E8F0]">
                  <p className="text-sm text-[#64748B] mb-1">Current Status</p>
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      hackathon.status === 'live' ? 'success' :
                      hackathon.status === 'draft' ? 'warning' :
                      hackathon.status === 'closed' ? 'secondary' : 'secondary'
                    } className="text-base px-4 py-1.5">
                      {hackathon.status.charAt(0).toUpperCase() + hackathon.status.slice(1)}
                    </Badge>
                    {autoStatusEnabled && (
                      <span className="text-xs text-[#64748B]">
                        (Auto-updating based on dates)
                      </span>
                    )}
                  </div>
                </div>

                {/* Manual Status Controls - Only show if auto is disabled */}
                {!autoStatusEnabled && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateStatus('draft')}
                        disabled={hackathon.status === 'draft' || updatingStatus}
                        className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                      >
                        Draft
                      </button>
                      <button
                        onClick={() => updateStatus('live')}
                        disabled={hackathon.status === 'live' || updatingStatus}
                        className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                      >
                        Live
                      </button>
                      <button
                        onClick={() => updateStatus('closed')}
                        disabled={hackathon.status === 'closed' || updatingStatus}
                        className="px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                      >
                        Closed
                      </button>
                      <button
                        onClick={() => updateStatus('finalized')}
                        disabled={hackathon.status === 'finalized' || updatingStatus}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                      >
                        Finalized
                      </button>
                    </div>
                    {updatingStatus && (
                      <p className="text-sm text-[#64748B]">Updating status...</p>
                    )}
                  </div>
                )}

                {/* Auto Status Info */}
                {autoStatusEnabled && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>Automatic Status Management:</strong> Status will automatically update based on the dates you entered when creating this hackathon.
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                      {hackathon.voting_closes_at && (
                        <li>When voting closes ({new Date(hackathon.voting_closes_at).toLocaleDateString()}), status changes to "Closed"</li>
                      )}
                      {hackathon.end_date && (
                        <li>When end date passes ({new Date(hackathon.end_date).toLocaleDateString()}), status changes to "Finalized"</li>
                      )}
                    </ul>
                    <button
                      onClick={autoUpdateStatus}
                      disabled={updatingStatus}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 underline disabled:opacity-50"
                    >
                      {updatingStatus ? 'Updating...' : 'Update Now'}
                    </button>
                  </div>
                )}
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white border border-[#E2E8F0]">
                <h3 className="text-xl font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-[#4F46E5] to-[#6366F1] rounded-full"></div>
                  Quick Actions
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/admin/hackathons/${hackathonId}/polls/create`}>
                    <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white hover:shadow-lg transition-all">
                      Create Poll
                    </Button>
                  </Link>
                  <Link href={`/admin/hackathons/${hackathonId}/integrity`}>
                    <Button variant="ghost" className="hover:bg-[#F8FAFC] transition-all">
                      Verify Integrity
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'form' && (
              <div className="space-y-6">
              {/* Create Form Template Section - Always Visible */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-[#0F172A] mb-2 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-[#4F46E5] to-[#6366F1] rounded-full"></div>
                    Create Form from Template
                  </h3>
                  <p className="text-sm text-[#64748B]">
                    Select a template to quickly create a form with pre-configured fields
                  </p>
                </div>

                  {formError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{formError}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    {/* Team Formation Template Card - Only Option */}
                    <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-100 shadow-md">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-semibold text-gray-900">Team Formation Form</h5>
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">
                        Collect team name, description, member information, and project details
                      </p>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Fields:</span> Team Name (required), Team Description, Team Members, Project Name, Project Details, Problem Statement, Solution, GitHub Link, Live Link
                      </div>
                    </div>
                  </div>

                <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      size="sm"
                      disabled={creatingField || formKeys.includes('team_formation')}
                      onClick={async () => {
                      // Check if form already exists
                      if (formKeys.includes('team_formation')) {
                        setFormError('Team Formation form already exists. You can edit existing fields.');
                        return;
                      }

                      // Team Formation Form Template (only option)
                      const templateFields = [
                        { fieldName: 'team_name', fieldLabel: 'Team Name', fieldType: 'text', isRequired: true, fieldDescription: 'Enter your team name (required)' },
                        { fieldName: 'team_description', fieldLabel: 'Team Description', fieldType: 'long_text', isRequired: false, fieldDescription: 'Brief description of your team' },
                        {
                          fieldName: 'team_members',
                          fieldLabel: 'Team Members',
                          fieldType: 'team_members',
                          isRequired: true,
                          fieldDescription: 'Add each team member with email, first name, last name, phone number (include country code), role, and mark one as Team Lead',
                        },
                        { fieldName: 'project_name', fieldLabel: 'Project Name', fieldType: 'text', isRequired: false, fieldDescription: 'Name of your project' },
                        { fieldName: 'project_details', fieldLabel: 'Project Details', fieldType: 'long_text', isRequired: false, fieldDescription: 'Detailed description of your project' },
                        { fieldName: 'problem_statement', fieldLabel: 'Problem Statement', fieldType: 'long_text', isRequired: false, fieldDescription: 'Describe the problem your project solves' },
                        { fieldName: 'solution', fieldLabel: 'Solution', fieldType: 'long_text', isRequired: false, fieldDescription: 'Explain your solution approach' },
                        { fieldName: 'github_link', fieldLabel: 'GitHub Link', fieldType: 'url', isRequired: false, fieldDescription: 'Link to your project repository (optional)' },
                        { fieldName: 'live_link', fieldLabel: 'Live Link', fieldType: 'url', isRequired: false, fieldDescription: 'Link to live demo or deployed project (optional)' },
                      ];

                      if (templateFields.length === 0) {
                        setFormError('No template available for this form type.');
                        return;
                      }

                      try {
                        setFormError('');
                        setCreatingField(true);
                        const token = localStorage.getItem('auth_token');
                        if (!token) {
                          router.push('/admin/login');
                          return;
                        }

                        const createdFields: AdminFormField[] = [];

                        for (const preset of templateFields) {
                          const response = await fetch(
                            `/api/v1/admin/hackathons/${hackathonId}/form`,
                            {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                              },
                                body: JSON.stringify({
                                  hackathonId,
                                  formKey: 'team_formation',
                                  fieldName: preset.fieldName,
                                  fieldType: preset.fieldType,
                                  fieldLabel: preset.fieldLabel,
                                  isRequired: preset.isRequired,
                                  fieldDescription: preset.fieldDescription,
                                  displayOrder: createdFields.length,
                                }),
                            },
                          );

                          const data = await response.json();
                          if (!response.ok) {
                            console.error('Failed to create field', preset.fieldName, data);
                            continue;
                          }

                          createdFields.push(data.field as AdminFormField);
                        }

                          if (createdFields.length > 0) {
                            setFormFields((previous) => [...previous, ...createdFields]);
                            // Update formKeys if new form was created
                            const newFormKeys = Array.from(new Set([...formKeys, 'team_formation']));
                            setFormKeys(newFormKeys.sort());
                            setFormError('');
                          } else {
                            setFormError('Failed to create form. Please try again.');
                          }
                        } catch (error) {
                          console.error('Error creating form template:', error);
                          setFormError('Failed to create Team Formation form. Please try again.');
                      } finally {
                        setCreatingField(false);
                      }
                    }}
                  >
                    {creatingField ? 'Creating...' : 'Create Form'}
                  </Button>
                </div>
              </Card>

              {/* Existing Forms Section */}
              <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Participation Form Fields</h3>
              </div>

              {formFields.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-600 mb-2">No forms created yet.</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Click "Use Form Template" above to create a Team Formation or Project Details form.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Group fields by form_key */}
                  {formKeys.map((formKey) => {
                    const fieldsForForm = formFields.filter(
                      (f) => (f.form_key || 'default') === formKey
                    );
                    const formLabel =
                      formKey === 'team_formation'
                        ? 'Team Formation Form'
                        : formKey === 'project_details'
                          ? 'Project Details Form'
                          : 'Default Form';
                    // Generate submission link for this form (all forms get their own link)
                    const submissionLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/hackathons/${hackathonId}/submit${formKey !== 'default' ? `?form=${formKey}` : ''}`;

                    const isExpanded = expandedForms.has(formKey);

                    return (
                      <div key={formKey} className="space-y-3 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 flex-1">
                            <button
                              onClick={() => toggleFormExpansion(formKey)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title={isExpanded ? 'Collapse fields' : 'Expand fields'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                            <h4 className="text-md font-semibold text-gray-900">{formLabel}</h4>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {fieldsForForm.length} field{fieldsForForm.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {/* Submission Link and Actions for this form */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={submissionLink}
                    readOnly
                              className="px-3 py-1.5 text-xs border border-gray-300 rounded bg-gray-50 w-64"
                  />
                  <button
                              onClick={() => copyFormSubmissionLink(formKey)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs flex items-center gap-1"
                              title="Copy submission link"
                            >
                              <Copy className="w-3 h-3" />
                              Copy
                            </button>
                            <a
                              href={submissionLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs flex items-center gap-1"
                              title="Open form in new tab"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Open
                            </a>
                            <button
                              onClick={() => handleDeleteForm(formKey)}
                              className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs flex items-center gap-1"
                              title="Delete entire form"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete Form
                  </button>
                </div>
            </div>
                        
                        {/* Form Fields - Only visible when expanded */}
                        {isExpanded && (
                          <div className="space-y-2 mt-4">
                        {fieldsForForm.map((field, index) => (
                          <div key={field.field_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            {editingFieldId === field.field_id ? (
                              // Edit mode
                              <div className="flex-1 grid md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Field Label
                                  </label>
                                  <input
                                    type="text"
                                    value={editingField?.field_label || ''}
                                    onChange={(e) =>
                                      setEditingField({
                                        ...editingField,
                                        field_label: e.target.value,
                                      })
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Description
                                  </label>
                                  <input
                                    type="text"
                                    value={editingField?.field_description || ''}
                                    onChange={(e) =>
                                      setEditingField({
                                        ...editingField,
                                        field_description: e.target.value,
                                      })
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                                <div className="flex items-end gap-2">
                                  <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700">
                                    <input
                                      type="checkbox"
                                      checked={editingField?.is_required || false}
                                      onChange={(e) =>
                                        setEditingField({
                                          ...editingField,
                                          is_required: e.target.checked,
                                        })
                                      }
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                                    />
                                    Required
                                  </label>
                                  <button
                                    onClick={() => handleSaveEdit(field.field_id)}
                                    className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                                    title="Save changes"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs"
                                    title="Cancel editing"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View mode
                              <>
                      <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-sm">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{field.field_label}</p>
                        <p className="text-sm text-gray-500">
                                    Type: {field.field_type}{' '}
                                    {field.is_required && <span className="text-red-500">*</span>}
                                    {field.field_description && (
                                      <span className="text-gray-400"> • {field.field_description}</span>
                                    )}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                        {field.visibility_scope}
                      </span>
                                <button
                                  onClick={() => handleStartEdit(field)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit field"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteField(field.field_id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete field"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                    </div>
                  ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="space-y-6">
              {/* Action Buttons */}
              <Card className="bg-gradient-to-br from-white to-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-[#0F172A] flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-[#4F46E5] to-[#6366F1] rounded-full"></div>
                    Teams Management
                  </h3>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => setShowCreateTeam(!showCreateTeam)}
                    className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white hover:shadow-lg transition-all"
                  >
                    {showCreateTeam ? 'Cancel' : '+ Create Team'}
                  </Button>
                  <Button
                    onClick={pullTeamsFromForm}
                    variant="secondary"
                    disabled={teamsLoading}
                    className="hover:shadow-md transition-all"
                  >
                    {teamsLoading ? 'Pulling...' : 'Pull from Form'}
                  </Button>
                  <Button
                    onClick={() => {
                      const fileInput = document.getElementById('csv-upload-teams');
                      fileInput?.click();
                    }}
                    variant="secondary"
                    className="hover:shadow-md transition-all"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                  </Button>
                </div>
              </Card>

              {/* Success/Error Messages */}
              {uploadSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                  {uploadSuccess}
                </div>
              )}
              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {uploadError}
                </div>
              )}

              {/* Create Team Form */}
              {showCreateTeam && (
                <Card className="bg-blue-50 border-2 border-blue-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Create New Team</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Team Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={teamFormData.teamName}
                        onChange={(e) => setTeamFormData({ ...teamFormData, teamName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                        placeholder="Enter team name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Team Description
                      </label>
                      <textarea
                        value={teamFormData.teamDescription}
                        onChange={(e) => setTeamFormData({ ...teamFormData, teamDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                        rows={3}
                        placeholder="Brief description of the team"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Team Members <span className="text-red-500">*</span>
                      </label>
                      {teamFormData.teamMembers.map((member, index) => (
                        <div key={index} className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Member {index + 1}</span>
                            {teamFormData.teamMembers.length > 1 && (
                              <button
                                onClick={() => {
                                  const newMembers = teamFormData.teamMembers.filter((_, i) => i !== index);
                                  setTeamFormData({ ...teamFormData, teamMembers: newMembers });
                                }}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
                              <input
                                type="email"
                                value={member.email}
                                onChange={(e) => {
                                  const newMembers = [...teamFormData.teamMembers];
                                  newMembers[index].email = e.target.value;
                                  setTeamFormData({ ...teamFormData, teamMembers: newMembers });
                                }}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                                placeholder="email@example.com"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">First Name <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                value={member.firstName}
                                onChange={(e) => {
                                  const newMembers = [...teamFormData.teamMembers];
                                  newMembers[index].firstName = e.target.value;
                                  setTeamFormData({ ...teamFormData, teamMembers: newMembers });
                                }}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                                placeholder="First name"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Last Name <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                value={member.lastName}
                                onChange={(e) => {
                                  const newMembers = [...teamFormData.teamMembers];
                                  newMembers[index].lastName = e.target.value;
                                  setTeamFormData({ ...teamFormData, teamMembers: newMembers });
                                }}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                                placeholder="Last name"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Phone</label>
                              <input
                                type="text"
                                value={member.phone}
                                onChange={(e) => {
                                  const newMembers = [...teamFormData.teamMembers];
                                  newMembers[index].phone = e.target.value;
                                  setTeamFormData({ ...teamFormData, teamMembers: newMembers });
                                }}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                                placeholder="+1234567890"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Role</label>
                              <input
                                type="text"
                                value={member.role}
                                onChange={(e) => {
                                  const newMembers = [...teamFormData.teamMembers];
                                  newMembers[index].role = e.target.value;
                                  setTeamFormData({ ...teamFormData, teamMembers: newMembers });
                                }}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                                placeholder="Developer, Designer, etc."
                              />
                            </div>
                            <div className="flex items-end">
                              <label className="flex items-center gap-2 text-xs text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={member.isLead}
                                  onChange={(e) => {
                                    const newMembers = [...teamFormData.teamMembers];
                                    // Only allow one lead
                                    if (e.target.checked) {
                                      newMembers.forEach((m, i) => {
                                        m.isLead = i === index;
                                      });
                                    } else {
                                      newMembers[index].isLead = false;
                                    }
                                    setTeamFormData({ ...teamFormData, teamMembers: newMembers });
                                  }}
                                  className="w-4 h-4 text-[#4F46E5] border-gray-300 rounded"
                                />
                                Team Lead
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setTeamFormData({
                            ...teamFormData,
                            teamMembers: [...teamFormData.teamMembers, { email: '', firstName: '', lastName: '', phone: '', role: '', isLead: false }],
                          });
                        }}
                        className="text-sm text-[#4F46E5] hover:text-[#6366F1] font-medium"
                      >
                        + Add Member
                      </button>
                    </div>
                    
                    {/* Project Information Section */}
                    <div className="mt-6 pt-6 border-t border-gray-300">
                      <h5 className="text-md font-semibold text-gray-900 mb-4">Project Information (Optional)</h5>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project Name
                          </label>
                          <input
                            type="text"
                            value={teamFormData.projectName}
                            onChange={(e) => setTeamFormData({ ...teamFormData, projectName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                            placeholder="Enter project name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project Details
                          </label>
                          <textarea
                            value={teamFormData.projectDetails}
                            onChange={(e) => setTeamFormData({ ...teamFormData, projectDetails: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                            rows={3}
                            placeholder="Detailed description of your project"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Problem Statement
                          </label>
                          <textarea
                            value={teamFormData.problemStatement}
                            onChange={(e) => setTeamFormData({ ...teamFormData, problemStatement: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                            rows={3}
                            placeholder="Describe the problem your project solves"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Solution
                          </label>
                          <textarea
                            value={teamFormData.solution}
                            onChange={(e) => setTeamFormData({ ...teamFormData, solution: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                            rows={3}
                            placeholder="Explain your solution approach"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              GitHub Link
                            </label>
                            <input
                              type="url"
                              value={teamFormData.githubLink}
                              onChange={(e) => setTeamFormData({ ...teamFormData, githubLink: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                              placeholder="https://github.com/username/repo"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Live Link
                            </label>
                            <input
                              type="url"
                              value={teamFormData.liveLink}
                              onChange={(e) => setTeamFormData({ ...teamFormData, liveLink: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                              placeholder="https://your-project.com"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCreateTeam(false);
                          setTeamFormData({
                            teamName: '',
                            teamDescription: '',
                            teamMembers: [{ email: '', firstName: '', lastName: '', phone: '', role: '', isLead: false }],
                            projectName: '',
                            projectDetails: '',
                            problemStatement: '',
                            solution: '',
                            githubLink: '',
                            liveLink: '',
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={createTeam}
                        disabled={creatingTeam}
                        className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white"
                      >
                        {creatingTeam ? 'Creating...' : 'Create Team'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Teams List */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Teams ({teams.length})</h3>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search teams..."
                      value={teamsSearch}
                      onChange={(e) => {
                        setTeamsSearch(e.target.value);
                        const token = localStorage.getItem('auth_token');
                        if (token) {
                          fetchTeams(token);
                        }
                      }}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    />
                  </div>
                </div>

                {teamsLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 mt-4">Loading teams...</p>
                  </div>
                ) : teams.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {teamsSearch ? 'No teams found matching your search.' : 'No teams found yet. Create a team or pull from form submissions.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teams.map((team) => {
                      const isExpanded = expandedTeamId === team.submissionId;
                      const teamLead = team.teamMembers?.find((m: any) => m.isLead);
                      const regularMembers = team.teamMembers?.filter((m: any) => !m.isLead) || [];
                      
                      return (
                        <div key={team.submissionId} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all">
                          {/* Team Header */}
                          <div className="p-5 bg-gradient-to-r from-white to-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-12 h-12 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                    {team.teamName?.[0]?.toUpperCase() || 'T'}
                                  </div>
                                  <div>
                                    <h4 className="text-xl font-bold text-gray-900">
                                      {team.teamName}
                                    </h4>
                                    {team.teamDescription && (
                                      <p className="text-sm text-gray-600 mt-1">
                                        {team.teamDescription}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                    <Users className="w-4 h-4" />
                                    <span className="font-medium">{team.teamMembers?.length || 0} member{(team.teamMembers?.length || 0) !== 1 ? 's' : ''}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(team.submittedAt).toLocaleDateString()}</span>
                                  </div>
                                  {team.projectName && (
                                    <div className="flex items-center gap-1.5">
                                      <Building2 className="w-4 h-4 text-blue-600" />
                                      <span className="text-blue-600 font-medium">{team.projectName}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Quick badges */}
                                {(team.githubLink || team.liveLink) && (
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {team.githubLink && (
                                      <Badge variant="secondary" className="text-xs">
                                        <Github className="w-3 h-3 mr-1" />
                                        GitHub
                                      </Badge>
                                    )}
                                    {team.liveLink && (
                                      <Badge variant="secondary" className="text-xs">
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        Live Demo
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setExpandedTeamId(isExpanded ? null : team.submissionId)}
                                className="flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                {isExpanded ? 'Hide Details' : 'View Details'}
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Expanded Team Details */}
                          {isExpanded && (
                            <div className="border-t border-gray-200 bg-gray-50">
                              <div className="p-6 space-y-6">
                                {/* Team Members Section */}
                                <div>
                                  <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-[#4F46E5]" />
                                    Team Members
                                  </h5>
                                  
                                  {/* Team Lead */}
                                  {teamLead && (
                                    <div className="mb-4">
                                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Team Lead</div>
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-start gap-4">
                                          <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                                            {teamLead.firstName?.[0] || teamLead.email?.[0] || 'L'}
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                              <p className="font-semibold text-gray-900 text-lg">
                                                {teamLead.firstName} {teamLead.lastName}
                                              </p>
                                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Lead</Badge>
                                            </div>
                                            <div className="space-y-1.5 text-sm text-gray-600">
                                              <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                {teamLead.email}
                                              </div>
                                              {teamLead.phone && (
                                                <div className="flex items-center gap-2">
                                                  <Phone className="w-4 h-4" />
                                                  {teamLead.phone}
                                                </div>
                                              )}
                                              {teamLead.role && (
                                                <div className="flex items-center gap-2">
                                                  <User className="w-4 h-4" />
                                                  {teamLead.role}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Other Members */}
                                  {regularMembers.length > 0 && (
                                    <div>
                                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                        Team Members ({regularMembers.length})
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {regularMembers.map((member: any, index: number) => (
                                          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                              <div className="w-10 h-10 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center font-semibold">
                                                {member.firstName?.[0] || member.email?.[0] || 'M'}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">
                                                  {member.firstName} {member.lastName}
                                                </p>
                                                <div className="space-y-1 text-xs text-gray-600 mt-1">
                                                  <div className="flex items-center gap-1.5 truncate">
                                                    <Mail className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{member.email}</span>
                                                  </div>
                                                  {member.phone && (
                                                    <div className="flex items-center gap-1.5">
                                                      <Phone className="w-3 h-3 flex-shrink-0" />
                                                      {member.phone}
                                                    </div>
                                                  )}
                                                  {member.role && (
                                                    <div className="flex items-center gap-1.5">
                                                      <User className="w-3 h-3 flex-shrink-0" />
                                                      {member.role}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Project Details Section */}
                                {(team.projectName || team.projectDetails || team.problemStatement || team.solution || team.githubLink || team.liveLink) && (
                                  <div className="border-t border-gray-200 pt-6">
                                    <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                      <Building2 className="w-5 h-5 text-[#4F46E5]" />
                                      Project Details
                                    </h5>
                                    
                                    <div className="space-y-4">
                                      {team.projectName && (
                                        <div>
                                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Project Name</div>
                                          <p className="text-gray-900 font-medium">{team.projectName}</p>
                                        </div>
                                      )}
                                      
                                      {team.projectDetails && (
                                        <div>
                                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Project Details</div>
                                          <p className="text-gray-900 whitespace-pre-wrap">{team.projectDetails}</p>
                                        </div>
                                      )}
                                      
                                      {team.problemStatement && (
                                        <div>
                                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Problem Statement</div>
                                          <p className="text-gray-900 whitespace-pre-wrap">{team.problemStatement}</p>
                                        </div>
                                      )}
                                      
                                      {team.solution && (
                                        <div>
                                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Solution</div>
                                          <p className="text-gray-900 whitespace-pre-wrap">{team.solution}</p>
                                        </div>
                                      )}
                                      
                                      {(team.githubLink || team.liveLink) && (
                                        <div>
                                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Links</div>
                                          <div className="flex flex-wrap gap-3">
                                            {team.githubLink && (
                                              <a
                                                href={team.githubLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                                              >
                                                <Github className="w-4 h-4" />
                                                GitHub Repository
                                                <ExternalLink className="w-3 h-3" />
                                              </a>
                                            )}
                                            {team.liveLink && (
                                              <a
                                                href={team.liveLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                              >
                                                <ExternalLink className="w-4 h-4" />
                                                Live Demo
                                                <ExternalLink className="w-3 h-3" />
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Submission Info */}
                                <div className="border-t border-gray-200 pt-4">
                                  <div className="flex items-center justify-between text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4" />
                                      <span>Submitted: {new Date(team.submittedAt).toLocaleString()}</span>
                                    </div>
                                    {team.submittedBy && (
                                      <span>By: {team.submittedBy}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Import Section */}
              <Card className="bg-gray-50 border border-gray-200">
                <h4 className="text-md font-semibold text-gray-900 mb-2">Import Teams from CSV</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a CSV file with team names and member details. Required fields: team_name, member_1_email, member_1_first_name, member_1_last_name
                </p>
                <input
                  type="file"
                  accept=".csv"
                  id="csv-upload-teams"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setUploadingTeams(true);
                    setUploadError('');
                    setUploadSuccess('');

                    try {
                      const token = localStorage.getItem('auth_token');
                      if (!token) {
                        setUploadError('Authentication required. Please log in again.');
                        setUploadingTeams(false);
                        return;
                      }

                      const formData = new FormData();
                      formData.append('file', file);

                      const response = await fetch(
                        `/api/v1/admin/hackathons/${hackathonId}/teams/upload-csv`,
                        {
                          method: 'POST',
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                          body: formData,
                        }
                      );

                      const data = await response.json();

                      if (response.ok) {
                        setUploadSuccess(
                          `Successfully imported ${data.created} team(s) from ${data.processed} row(s).`
                        );
                        if (data.errors && data.errors.length > 0) {
                          setUploadError(`Some errors occurred: ${data.errors.join('; ')}`);
                        }
                        e.target.value = '';
                        await fetchTeams(token);
                        setTimeout(() => setUploadSuccess(''), 5000);
                      } else {
                        setUploadError(data.error || 'Failed to upload CSV file. Please check that all required fields are present.');
                      }
                    } catch (error: any) {
                      console.error('CSV upload error:', error);
                      setUploadError('Failed to upload CSV file. Please try again.');
                    } finally {
                      setUploadingTeams(false);
                    }
                  }}
                  disabled={uploadingTeams}
                />
                <div className="flex items-center gap-4">
                  <label
                    htmlFor="csv-upload-teams"
                    className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors ${
                      uploadingTeams ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingTeams ? 'Uploading...' : 'Choose CSV File'}
                  </label>
                  <button
                    onClick={downloadCsvTemplate}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Download Sample Template
                  </button>
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 mb-2 font-semibold">Required CSV Columns:</p>
                  <ul className="text-xs text-blue-800 list-disc list-inside space-y-1">
                    <li><strong>team_name</strong> (required) - The name of the team</li>
                    <li><strong>member_1_email</strong> (required) - First member's email</li>
                    <li><strong>member_1_first_name</strong> (required) - First member's first name</li>
                    <li><strong>member_1_last_name</strong> (required) - First member's last name</li>
                    <li><strong>member_1_phone</strong> (optional) - First member's phone</li>
                    <li><strong>member_1_role</strong> (optional) - First member's role</li>
                    <li><strong>member_1_is_lead</strong> (optional) - "true" if team lead</li>
                    <li>Repeat for additional members (member_2_*, member_3_*, etc.)</li>
                  </ul>
                </div>
              </Card>
            </div>
          )}


          {activeTab === 'submissions' && (
            <Card>
              <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Submissions</h3>
                
                {/* Search */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const token = localStorage.getItem('auth_token');
                    if (token) {
                      setSubmissionsPagination((p) => ({ ...p, page: 1 }));
                      fetchSubmissions(token, 1, submissionsSearch);
                    }
                  }}
                  className="flex gap-3 mb-4"
                >
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by team name or project name..."
                      value={submissionsSearch}
                      onChange={(e) => setSubmissionsSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Button type="submit" variant="secondary" size="sm">
                    Search
                  </Button>
                  {submissionsSearch && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSubmissionsSearch('');
                        const token = localStorage.getItem('auth_token');
                        if (token) {
                          setSubmissionsPagination((p) => ({ ...p, page: 1 }));
                          fetchSubmissions(token, 1, '');
                        }
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </form>
              </div>

              {submissionsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-600 mt-4">Loading submissions...</p>
                </div>
              ) : submissions.length === 0 ? (
                <p className="text-gray-600">
                  {submissionsSearch ? 'No submissions found matching your search.' : 'No submissions yet'}
                </p>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {submissions.map((submission) => {
                      // Determine submission type based on submission_data structure
                      const hasTeamMembers = Array.isArray(submission.submission_data?.team_members);
                      const hasProjectDetails = submission.submission_data?.project_name || submission.submission_data?.problem_statement || submission.submission_data?.solution;
                      
                      let submissionType = 'General Submission';
                      let submissionTypeColor = 'bg-gray-100 text-gray-700';
                      
                      if (hasTeamMembers) {
                        submissionType = 'Team Formation';
                        submissionTypeColor = 'bg-blue-100 text-blue-700';
                      } else if (hasProjectDetails) {
                        submissionType = 'Project Details';
                        submissionTypeColor = 'bg-green-100 text-green-700';
                      }

                      const teamName = submission.submission_data?.team_name;
                      const projectName = submission.submission_data?.project_name;
                      const teamDescription = submission.submission_data?.team_description;
                      const projectDescription = submission.submission_data?.project_description;
                      const problemStatement = submission.submission_data?.problem_statement;
                      const solution = submission.submission_data?.solution;
                      const githubLink = submission.submission_data?.github_link;
                      const liveLink = submission.submission_data?.live_link;
                      const teamMembers = submission.submission_data?.team_members;

                      return (
                        <div key={submission.submission_id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-semibold text-gray-900">
                                  {projectName || teamName || 'Untitled Submission'}
                                </p>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${submissionTypeColor}`}>
                                  {submissionType}
                                </span>
                                {submission.poll_id && (
                                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">
                                    Poll Submission
                                  </span>
                                )}
                              </div>
                          <p className="text-sm text-gray-500">
                            Submitted: {new Date(submission.submitted_at).toLocaleString()}
                                {submission.submitted_by && ` by ${submission.submitted_by}`}
                              </p>
                              {/* Show poll association if this submission is for a specific poll */}
                              {submission.poll_id && (
                                <p className="text-xs text-purple-600 mt-1">
                                  📊 Poll: {submission.poll_name || submission.poll_id}
                                </p>
                              )}
                        </div>
                            <div className="flex items-center gap-2">
                              {submission.poll_id && (
                                <Link href={`/admin/polls/${submission.poll_id}`}>
                                  <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200">
                                    View Poll
                                  </Badge>
                                </Link>
                              )}
                        {submission.is_locked && (
                          <Badge variant="secondary">Locked</Badge>
                        )}
                      </div>
                          </div>

                          {/* Team Formation Details */}
                          {hasTeamMembers && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              {teamName && (
                                <p className="text-sm text-gray-700 mb-1">
                                  <strong>Team Name:</strong> {teamName}
                        </p>
                      )}
                              {teamDescription && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {teamDescription}
                                </p>
                              )}
                              {teamMembers && Array.isArray(teamMembers) && teamMembers.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-600 mb-1">Team Members ({teamMembers.length}):</p>
                                  <div className="flex flex-wrap gap-2">
                                    {teamMembers.slice(0, 5).map((member: any, idx: number) => (
                                      <span key={idx} className="text-xs px-2 py-1 bg-gray-100 rounded">
                                        {member.firstName} {member.lastName}
                                        {member.isLead && <span className="ml-1 text-blue-600 font-semibold">(Lead)</span>}
                                      </span>
                                    ))}
                                    {teamMembers.length > 5 && (
                                      <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-500">
                                        +{teamMembers.length - 5} more
                                      </span>
                                    )}
                                  </div>
                </div>
                              )}
                            </div>
                          )}

                          {/* Project Details */}
                          {hasProjectDetails && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              {teamName && projectName && (
                                <p className="text-sm text-gray-700 mb-1">
                                  <strong>Submitting Team:</strong> {teamName}
                                </p>
                              )}
                              {projectDescription && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {projectDescription}
                                </p>
                              )}
                              {problemStatement && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium text-gray-600 mb-1">Problem Statement:</p>
                                  <p className="text-sm text-gray-700">{problemStatement}</p>
                                </div>
                              )}
                              {solution && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium text-gray-600 mb-1">Solution:</p>
                                  <p className="text-sm text-gray-700">{solution}</p>
                                </div>
                              )}
                              {(githubLink || liveLink) && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {githubLink && (
                                    <a
                                      href={githubLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                                    >
                                      🔗 GitHub Repository
                                    </a>
                                  )}
                                  {liveLink && (
                                    <a
                                      href={liveLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                                    >
                                      🌐 Live Demo
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {submissionsPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Showing {((submissionsPagination.page - 1) * submissionsPagination.pageSize) + 1} to{' '}
                        {Math.min(submissionsPagination.page * submissionsPagination.pageSize, submissionsPagination.total)} of{' '}
                        {submissionsPagination.total} submissions
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const token = localStorage.getItem('auth_token');
                            if (token) {
                              const newPage = Math.max(1, submissionsPagination.page - 1);
                              setSubmissionsPagination((p) => ({ ...p, page: newPage }));
                              fetchSubmissions(token, newPage, submissionsSearch);
                            }
                          }}
                          disabled={submissionsPagination.page === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const token = localStorage.getItem('auth_token');
                            if (token) {
                              const newPage = Math.min(submissionsPagination.totalPages, submissionsPagination.page + 1);
                              setSubmissionsPagination((p) => ({ ...p, page: newPage }));
                              fetchSubmissions(token, newPage, submissionsSearch);
                            }
                          }}
                          disabled={submissionsPagination.page === submissionsPagination.totalPages}
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          )}
          
          {activeTab === 'polls' && (
            <>
              {selectedPollId && selectedPoll ? (
                // Poll Management View
                <div className="space-y-6">
                    {/* Back Button and Header */}
                  <Card>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="secondary"
                          onClick={handleBackToPollsList}
                          className="flex items-center gap-2"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Back to Polls
                        </Button>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{selectedPoll.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(selectedPoll.start_time).toLocaleString()} - {new Date(selectedPoll.end_time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => {
                            setShowEditTimeline(true);
                          }} 
                          variant="outline"
                        >
                          Adjust Timeline
                        </Button>
                        <Button
                          onClick={() => {
                            setEditPollName(selectedPoll.name);
                            const start = new Date(selectedPoll.start_time);
                            const end = new Date(selectedPoll.end_time);
                            setEditPollStartTime(start.toISOString().slice(0, 16));
                            setEditPollEndTime(end.toISOString().slice(0, 16));
                            setEditPollVotingMode(selectedPoll.voting_mode || 'single');
                            setEditPollVotingPermissions(selectedPoll.voting_permissions || 'voters_and_judges');
                            setEditPollVoterWeight(selectedPoll.voter_weight?.toString() || '1.0');
                            setEditPollJudgeWeight(selectedPoll.judge_weight?.toString() || '1.0');
                            setEditPollAllowSelfVote(selectedPoll.allow_self_vote || false);
                            setEditPollRequireTeamNameGate(selectedPoll.require_team_name_gate !== false);
                            setEditPollIsPublicResults(selectedPoll.is_public_results || false);
                            setEditPollMaxRankedPositions(selectedPoll.max_ranked_positions?.toString() || '');
                            setEditPollVotingSequence(selectedPoll.voting_sequence || 'simultaneous');
                            setEditPollAllowVoteEditing(selectedPoll.allow_vote_editing || false);
                            setEditPollMinVoterParticipation(selectedPoll.min_voter_participation?.toString() || '');
                            setEditPollMinJudgeParticipation(selectedPoll.min_judge_participation?.toString() || '');
                            setShowEditPoll(true);
                          }}
                          className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1]"
                        >
                          Edit Details
                        </Button>
                        <Link href={`/admin/polls/${selectedPollId}`} target="_blank">
                          <Button variant="outline">
                            Open in New Tab
                          </Button>
                        </Link>
                      </div>
                    </div>
                    
                    {/* Messages */}
                    {pollSuccess && (
                      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                        <span>✅</span> {pollSuccess}
                      </div>
                    )}
                    {pollError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                        <span>⚠️</span> {pollError}
                      </div>
                    )}

                    {/* Management Tabs */}
                    <div className="flex overflow-x-auto border-b border-gray-200 mb-6 gap-6">
                      {(['overview', 'teams', 'voters', 'judges', 'results'] as const)
                        .filter((tab) => {
                          const votingPermissions = selectedPoll.voting_permissions;
                          if (!votingPermissions) return true;
                          if (tab === 'voters' && votingPermissions === 'judges_only') return false;
                          if (tab === 'judges' && votingPermissions === 'voters_only') return false;
                          return true;
                        })
                        .map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setPollManagementTab(tab)}
                            className={`pb-3 font-medium transition-all border-b-2 whitespace-nowrap ${
                              pollManagementTab === tab
                                ? 'border-[#4F46E5] text-[#4F46E5]'
                                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                            }`}
                          >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                          </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {pollManagementLoading ? (
                      <div className="text-center py-8">
                        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-600">Loading poll data...</p>
                      </div>
                    ) : (
                      <>
                        {pollManagementTab === 'overview' && (
                          <Card className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Poll Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-600">Status</p>
                                <Badge
                                  variant={
                                    new Date() >= new Date(selectedPoll.start_time) && new Date() <= new Date(selectedPoll.end_time)
                                      ? 'success'
                                      : new Date() < new Date(selectedPoll.start_time)
                                      ? 'warning'
                                      : 'secondary'
                                  }
                                >
                                  {new Date() >= new Date(selectedPoll.start_time) && new Date() <= new Date(selectedPoll.end_time)
                                    ? 'Active'
                                    : new Date() < new Date(selectedPoll.start_time)
                                    ? 'Upcoming'
                                    : 'Ended'}
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-600">Teams</p>
                                <p className="text-lg font-semibold text-gray-900">{pollTeams.length}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-600">Registered Voters</p>
                                <p className="text-lg font-semibold text-gray-900">{pollTokens.length}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-600">Judges</p>
                                <p className="text-lg font-semibold text-gray-900">{pollJudges.length}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-600">Voting Mode</p>
                                <p className="text-lg font-semibold text-gray-900 capitalize">{selectedPoll.voting_mode || 'single'}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-600">Results Public</p>
                                <p className="text-lg font-semibold text-gray-900">{selectedPoll.is_public_results ? 'Yes' : 'No'}</p>
                              </div>
                            </div>
                          </Card>
                        )}

                        {pollManagementTab === 'teams' && (
                          <Card className="p-6">
                            <div className="flex justify-between items-center mb-6">
                              <h2 className="text-xl font-semibold text-gray-900">Teams ({pollTeams.length})</h2>
                              <div className="flex gap-3">
                                <Button 
                                  onClick={async () => {
                                    if (!selectedPollId) return;
                                    const token = localStorage.getItem('auth_token');
                                    if (!token) return;
                                    setPollSubmitting(true);
                                    setPollError('');
                                    setPollSuccess('');
                                    try {
                                      const hackathonTeamsRes = await fetch(`/api/v1/admin/polls/${selectedPollId}/hackathon-teams`, {
                                        headers: { Authorization: `Bearer ${token}` },
                                      });
                                      if (!hackathonTeamsRes.ok) {
                                        const errorData = await hackathonTeamsRes.json();
                                        throw new Error(errorData.error || 'Failed to fetch hackathon teams');
                                      }
                                      const hackathonTeamsData = await hackathonTeamsRes.json();
                                      const hackathonTeams = hackathonTeamsData.teams || [];
                                      
                                      // Debug: Log first team to see what data we're getting
                                      if (hackathonTeams.length > 0) {
                                        console.log('Debug: First hackathon team data:', {
                                          teamName: hackathonTeams[0].teamName,
                                          hasTeamMembers: !!hackathonTeams[0].teamMembers,
                                          teamMembersCount: hackathonTeams[0].teamMembers?.length || 0,
                                          teamMembers: hackathonTeams[0].teamMembers,
                                        });
                                      }
                                      
                                      if (hackathonTeams.length === 0) {
                                        setPollError('No teams found in hackathon. Teams must be created through team_formation submissions first.');
                                        return;
                                      }
                                      
                                      const existingTeamNames = new Set(pollTeams.map(t => t.team_name));
                                      const teamsToCreate = hackathonTeams.filter((ht: any) => !existingTeamNames.has(ht.teamName));
                                      
                                      if (teamsToCreate.length === 0) {
                                        setPollSuccess('All hackathon teams are already in this poll.');
                                        return;
                                      }
                                      
                                      for (const hackathonTeam of teamsToCreate) {
                                        try {
                                          // Build comprehensive metadata with all team details
                                          const metadata: any = {};
                                          
                                          // Project details
                                          if (hackathonTeam.projectName) metadata.projectName = hackathonTeam.projectName;
                                          if (hackathonTeam.projectDescription) metadata.projectDescription = hackathonTeam.projectDescription;
                                          if (hackathonTeam.pitch) metadata.pitch = hackathonTeam.pitch;
                                          if (hackathonTeam.liveSiteUrl) metadata.liveSiteUrl = hackathonTeam.liveSiteUrl;
                                          if (hackathonTeam.githubUrl) metadata.githubUrl = hackathonTeam.githubUrl;
                                          
                                          // Team details
                                          if (hackathonTeam.teamDescription) metadata.teamDescription = hackathonTeam.teamDescription;
                                          
                                          // Team members - ensure all details are included from database
                                          // The API returns team_members from hackathon_submissions, so we normalize the structure
                                          console.log(`Debug: Processing team "${hackathonTeam.teamName}"`, {
                                            hasTeamMembers: !!hackathonTeam.teamMembers,
                                            teamMembersType: typeof hackathonTeam.teamMembers,
                                            teamMembersIsArray: Array.isArray(hackathonTeam.teamMembers),
                                            teamMembersLength: hackathonTeam.teamMembers?.length || 0,
                                            teamMembers: hackathonTeam.teamMembers,
                                          });
                                          
                                          if (hackathonTeam.teamMembers && Array.isArray(hackathonTeam.teamMembers) && hackathonTeam.teamMembers.length > 0) {
                                            // Map team members to ensure all fields are included and normalized
                                            // Handle both camelCase (firstName) and snake_case (first_name) field variations
                                            metadata.teamMembers = hackathonTeam.teamMembers.map((member: any) => {
                                              // Normalize field names to ensure consistency
                                              const normalizedMember: any = {
                                                email: member.email || '',
                                                firstName: member.firstName || member.first_name || '',
                                                lastName: member.lastName || member.last_name || '',
                                                phone: member.phone || '',
                                                role: member.role || '',
                                                // Handle boolean conversion for isLead
                                                isLead: member.isLead === true || member.isLead === 'true' || member.is_lead === true || member.is_lead === 'true' || false,
                                              };
                                              
                                              // Include any additional fields that might exist
                                              if (member.github) normalizedMember.github = member.github;
                                              if (member.linkedin) normalizedMember.linkedin = member.linkedin;
                                              if (member.portfolio) normalizedMember.portfolio = member.portfolio;
                                              
                                              return normalizedMember;
                                            });
                                            
                                            // Log for debugging if needed
                                            console.log(`Including ${metadata.teamMembers.length} team member(s) for team "${hackathonTeam.teamName}"`, metadata.teamMembers);
                                          } else {
                                            console.warn(`No team members found for team "${hackathonTeam.teamName}"`, {
                                              teamMembers: hackathonTeam.teamMembers,
                                              type: typeof hackathonTeam.teamMembers,
                                              isArray: Array.isArray(hackathonTeam.teamMembers),
                                            });
                                          }
                                          
                                          // Always include metadata even if empty to ensure team members are stored
                                          await fetch(`/api/v1/admin/polls/${selectedPollId}/teams`, {
                                            method: 'POST',
                                            headers: {
                                              Authorization: `Bearer ${token}`,
                                              'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({ 
                                              teamName: hackathonTeam.teamName,
                                              metadata: metadata,
                                            }),
                                          });
                                        } catch (err) {
                                          console.error(`Failed to create team "${hackathonTeam.teamName}":`, err);
                                        }
                                      }
                                      
                                      setPollSuccess(`Successfully imported ${teamsToCreate.length} team(s) from hackathon!`);
                                      await fetchPollManagementData(selectedPollId);
                                    } catch (err: any) {
                                      setPollError(err.message || 'Failed to pull teams from hackathon');
                                    } finally {
                                      setPollSubmitting(false);
                                    }
                                  }}
                                  isLoading={pollSubmitting}
                                  variant="outline"
                                  className="border-[#059669] text-[#059669] hover:bg-[#059669]/10"
                                >
                                  Pull from Hackathon
                                </Button>
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
                                  value={pollTeamsSearch}
                                  onChange={(e) => setPollTeamsSearch(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                              </div>
                              <select
                                value={pollTeamsFilter}
                                onChange={(e) => setPollTeamsFilter(e.target.value as any)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="all">All Teams</option>
                                <option value="with_members">With Members</option>
                                <option value="no_members">No Members</option>
                              </select>
                            </div>
                            
                            {(() => {
                              let filteredTeams = pollTeams;
                              
                              if (pollTeamsSearch) {
                                const query = pollTeamsSearch.toLowerCase();
                                filteredTeams = filteredTeams.filter(t => 
                                  t.team_name.toLowerCase().includes(query)
                                );
                              }
                              
                              if (pollTeamsFilter !== 'all') {
                                filteredTeams = filteredTeams.filter(team => {
                                  const memberCount = pollTokens.filter(t =>
                                    t.team_id === team.team_id || t.teamId === team.team_id
                                  ).length;
                                  return pollTeamsFilter === 'with_members' ? memberCount > 0 : memberCount === 0;
                                });
                              }
                              
                              return filteredTeams.length === 0 ? (
                                <p className="text-gray-600 text-center py-8">
                                  {pollTeams.length === 0 
                                    ? 'No teams added yet.' 
                                    : 'No teams match your search criteria.'}
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {filteredTeams.map((team) => {
                                    const memberCount = pollTokens.filter(t =>
                                      t.team_id === team.team_id || t.teamId === team.team_id
                                    ).length;
                                    
                                    // Extract team members from metadata
                                    // Metadata can be a string (JSON) or an object
                                    let teamMembers: any[] = [];
                                    try {
                                      let metadataObj: any = null;
                                      
                                      // Parse metadata if it's a string
                                      if (team.metadata) {
                                        if (typeof team.metadata === 'string') {
                                          try {
                                            metadataObj = JSON.parse(team.metadata);
                                          } catch (e) {
                                            console.error('Error parsing metadata string:', e);
                                          }
                                        } else if (typeof team.metadata === 'object') {
                                          metadataObj = team.metadata;
                                        }
                                      }
                                      
                                      // Extract teamMembers from parsed metadata
                                      if (metadataObj && metadataObj.teamMembers) {
                                        if (Array.isArray(metadataObj.teamMembers)) {
                                          teamMembers = metadataObj.teamMembers;
                                        } else if (typeof metadataObj.teamMembers === 'string') {
                                          try {
                                            teamMembers = JSON.parse(metadataObj.teamMembers);
                                          } catch (e) {
                                            console.error('Error parsing teamMembers array:', e);
                                          }
                                        }
                                      }
                                    } catch (e) {
                                      console.error('Error extracting team members:', e, 'Team:', team);
                                    }
                                    
                                    const isTeamExpanded = expandedPollTeamId === team.team_id;
                                    
                                    return (
                                      <div key={team.team_id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-[#4F46E5]/50 transition-colors">
                                        <div className="p-4 flex justify-between items-center">
                                          <div className="flex-1">
                                            <div className="font-medium text-gray-900">{team.team_name}</div>
                                            <div className="text-sm text-gray-600 mt-1">
                                              {memberCount > 0 ? `${memberCount} registered voter(s)` : 'No registered voters'}
                                              {teamMembers.length > 0 && (
                                                <span className="ml-2">• {teamMembers.length} team member(s) from database</span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex gap-2">
                                            {teamMembers.length > 0 && (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                  setExpandedPollTeamId(isTeamExpanded ? null : team.team_id);
                                                }}
                                                className="text-[#4F46E5] hover:text-[#4338CA] hover:bg-[#EEF2FF]"
                                              >
                                                {isTeamExpanded ? (
                                                  <>
                                                    <ChevronUp className="w-4 h-4 mr-1" />
                                                    Hide Members
                                                  </>
                                                ) : (
                                                  <>
                                                    <ChevronDown className="w-4 h-4 mr-1" />
                                                    Show Members
                                                  </>
                                                )}
                                              </Button>
                                            )}
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                setPollEditingTeam(team);
                                                setPollEditTeamName(team.team_name);
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
                                                if (!token || !selectedPollId) return;
                                                try {
                                                  const response = await fetch(`/api/v1/admin/polls/${selectedPollId}/teams/${team.team_id}`, {
                                                    method: 'DELETE',
                                                    headers: { Authorization: `Bearer ${token}` },
                                                  });
                                                  if (!response.ok) throw new Error('Failed to delete');
                                                  setPollSuccess('Team deleted successfully');
                                                  await fetchPollManagementData(selectedPollId);
                                                } catch (err) {
                                                  setPollError('Failed to delete team');
                                                }
                                              }}
                                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                            >
                                              Delete
                                            </Button>
                                          </div>
                                        </div>
                                        
                                        {/* Expanded Team Members Section */}
                                        {isTeamExpanded && teamMembers.length > 0 && (
                                          <div className="border-t border-gray-200 bg-gray-50 p-4">
                                            <h5 className="text-sm font-semibold text-gray-900 mb-3">Team Members from Database</h5>
                                            <div className="space-y-2">
                                              {teamMembers.map((member: any, index: number) => (
                                                <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                                                  <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                      <div className="font-medium text-gray-900">
                                                        {member.firstName || member.first_name ? 
                                                          `${member.firstName || member.first_name} ${member.lastName || member.last_name || ''}`.trim() 
                                                          : 'Unnamed Member'}
                                                      </div>
                                                      <div className="text-sm text-gray-600 mt-1">
                                                        {member.email && (
                                                          <div className="flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />
                                                            {member.email}
                                                          </div>
                                                        )}
                                                        {member.phone && (
                                                          <div className="flex items-center gap-1 mt-1">
                                                            <Phone className="w-3 h-3" />
                                                            {member.phone}
                                                          </div>
                                                        )}
                                                        {member.role && (
                                                          <div className="mt-1">
                                                            <span className="text-xs font-medium text-gray-500">Role:</span> {member.role}
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      {member.isLead || member.is_lead ? (
                                                        <Badge variant="success" className="text-xs">Team Lead</Badge>
                                                      ) : null}
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </Card>
                        )}

                        {pollManagementTab === 'voters' && (
                          <Card className="p-6">
                            <div className="flex justify-between items-center mb-6">
                              <h2 className="text-xl font-semibold text-gray-900">Voters ({pollTokens.length})</h2>
                              <div className="flex gap-3">
                                <Button 
                                  onClick={async () => {
                                    if (!selectedPollId) return;
                                    const token = localStorage.getItem('auth_token');
                                    if (!token) return;
                                    setPollSubmitting(true);
                                    setPollError('');
                                    setPollSuccess('');
                                    try {
                                      const response = await fetch(`/api/v1/admin/polls/${selectedPollId}/auto-populate-voters`, {
                                        method: 'POST',
                                        headers: { Authorization: `Bearer ${token}` },
                                      });
                                      const data = await response.json();
                                      if (response.ok) {
                                        setPollSuccess(`Auto-populated ${data.votersCreated} voter(s) from ${data.teamsCreated} team(s)!`);
                                        await fetchPollManagementData(selectedPollId);
                                      } else {
                                        setPollError(data.error || 'Failed to auto-populate voters');
                                      }
                                    } catch (err: any) {
                                      setPollError(err.message || 'An error occurred');
                                    } finally {
                                      setPollSubmitting(false);
                                    }
                                  }}
                                  isLoading={pollSubmitting}
                                  variant="outline"
                                  className="border-[#059669] text-[#059669] hover:bg-[#059669]/10"
                                >
                                  Auto-Populate from Teams
                                </Button>
                                <Button onClick={() => setShowRegisterVoters(true)} className="bg-[#059669] hover:bg-[#047857]">
                                  Register Voters
                                </Button>
                                {pollTokens.length > 0 && (
                                  <Button
                                    onClick={async () => {
                                      if (!selectedPollId) return;
                                      const token = localStorage.getItem('auth_token');
                                      if (!token) return;
                                      setPollSubmitting(true);
                                      try {
                                        const response = await fetch(`/api/v1/admin/polls/${selectedPollId}/voters/send-emails`, {
                                          method: 'POST',
                                          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                                        });
                                        const data = await response.json();
                                        if (response.ok) {
                                          setPollSuccess(`Emails sent: ${data.sent}, Failed: ${data.failed}`);
                                          await fetchPollManagementData(selectedPollId);
                                        } else {
                                          setPollError(data.error || 'Failed to send emails');
                                        }
                                      } catch (err) {
                                        setPollError('An error occurred');
                                      } finally {
                                        setPollSubmitting(false);
                                      }
                                    }}
                                    isLoading={pollSubmitting}
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
                                  value={pollVotersSearch}
                                  onChange={(e) => setPollVotersSearch(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                              </div>
                              <select
                                value={pollVotersFilter}
                                onChange={(e) => setPollVotersFilter(e.target.value as any)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="all">All Voters</option>
                                <option value="voted">Voted</option>
                                <option value="not_voted">Not Voted</option>
                              </select>
                            </div>
                            
                            {(() => {
                              let filteredTokens = pollTokens;
                              
                              if (pollVotersSearch) {
                                const query = pollVotersSearch.toLowerCase();
                                filteredTokens = filteredTokens.filter(token => {
                                  const team = pollTeams.find(t => t.team_id === token.team_id || t.team_id === token.teamId);
                                  return (
                                    token.email.toLowerCase().includes(query) ||
                                    team?.team_name.toLowerCase().includes(query)
                                  );
                                });
                              }
                              
                              if (pollVotersFilter !== 'all') {
                                filteredTokens = filteredTokens.filter(token => {
                                  const hasVoted = token.hasVoted !== undefined 
                                    ? token.hasVoted 
                                    : token.used;
                                  return pollVotersFilter === 'voted' ? hasVoted : !hasVoted;
                                });
                              }
                              
                              return filteredTokens.length === 0 ? (
                                <p className="text-gray-600 text-center py-8">
                                  {pollTokens.length === 0 
                                    ? 'No voters registered yet.' 
                                    : 'No voters match your search criteria.'}
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {filteredTokens.map((token) => {
                                    const team = pollTeams.find(t => t.team_id === token.team_id || t.team_id === token.teamId);
                                    const getDeliveryStatusDisplay = (status: string | undefined) => {
                                      if (!status || status === 'queued') return { text: 'Email not sent', color: 'text-gray-500' };
                                      if (status === 'sent') return { text: 'Email sent', color: 'text-green-600' };
                                      if (status === 'delivered') return { text: 'Email delivered', color: 'text-green-700' };
                                      if (status === 'failed' || status === 'bounced') return { text: 'Email failed', color: 'text-red-600' };
                                      return { text: 'Unknown', color: 'text-gray-600' };
                                    };
                                    const deliveryStatus = getDeliveryStatusDisplay(token.emailStatus || token.deliveryStatus);
                                    return (
                                      <div key={token.tokenId || token.token_id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                        <div>
                                          <div className="font-medium text-gray-900">{token.email}</div>
                                          <div className="text-sm text-gray-600 mt-1">
                                            Team: <span className="font-medium">{team?.team_name || token.team_name || 'Unknown'}</span>
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
                                              setPollReassigningVoter(token);
                                              setPollSelectedReassignTeam(token.team_id);
                                              setPollReassignTeamSearchQuery(team?.team_name || '');
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
                                              if (!token2 || !selectedPollId) return;
                                              try {
                                                const response = await fetch(`/api/v1/admin/polls/${selectedPollId}/voters/${token.tokenId || token.token_id}`, {
                                                  method: 'DELETE',
                                                  headers: { Authorization: `Bearer ${token2}` },
                                                });
                                                if (!response.ok) throw new Error('Failed');
                                                setPollSuccess('Voter removed');
                                                await fetchPollManagementData(selectedPollId);
                                              } catch (err) {
                                                setPollError('Failed to remove voter');
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

                        {pollManagementTab === 'judges' && (
                          <Card className="p-6">
                            <div className="flex justify-between items-center mb-6">
                              <h2 className="text-xl font-semibold text-gray-900">Judges ({pollJudges.length})</h2>
                              <div className="flex gap-3">
                                <Button 
                                  onClick={() => { 
                                    setShowAddJudge(true); 
                                    setPollJudgeEmail(''); 
                                    setPollJudgeName(''); 
                                  }} 
                                  className="bg-[#1e40af] hover:bg-[#1e3a8a]"
                                >
                                  Add Judge
                                </Button>
                                {pollJudges.length > 0 && (
                                  <Button
                                    onClick={async () => {
                                      if (!selectedPollId) return;
                                      const token = localStorage.getItem('auth_token');
                                      if (!token) return;
                                      setPollSubmitting(true);
                                      try {
                                        const response = await fetch(`/api/v1/admin/polls/${selectedPollId}/judges/send-emails`, {
                                          method: 'POST',
                                          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                                        });
                                        const data = await response.json();
                                        if (response.ok) {
                                          setPollSuccess(`Emails sent: ${data.sent}, Failed: ${data.failed}`);
                                          await fetchPollManagementData(selectedPollId);
                                        } else {
                                          setPollError(data.error || 'Failed');
                                        }
                                      } catch (err) {
                                        setPollError('Error sending emails');
                                      } finally {
                                        setPollSubmitting(false);
                                      }
                                    }}
                                    isLoading={pollSubmitting}
                                    className="bg-[#059669] hover:bg-[#047857]"
                                  >
                                    Send Emails
                                  </Button>
                                )}
                              </div>
                            </div>
                            {pollJudges.length === 0 ? (
                              <p className="text-gray-600 text-center py-8">No judges added yet.</p>
                            ) : (
                              <div className="space-y-3">
                                {pollJudges.map((judge: any) => {
                                  const getEmailStatusDisplay = (status: string | undefined) => {
                                    if (!status || status === 'queued') return { text: 'Email not sent', color: 'text-gray-500' };
                                    if (status === 'sent') return { text: 'Email sent', color: 'text-green-600' };
                                    if (status === 'delivered') return { text: 'Email delivered', color: 'text-green-700' };
                                    if (status === 'failed' || status === 'bounced') return { text: 'Email failed', color: 'text-red-600' };
                                    return { text: 'Unknown', color: 'text-gray-600' };
                                  };
                                  const deliveryStatus = getEmailStatusDisplay(judge.emailStatus || judge.deliveryStatus);
                                  return (
                                    <div key={judge.judge_id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                      <div>
                                        <div className="font-medium text-gray-900">{judge.email}</div>
                                        {judge.name && <div className="text-sm text-gray-600 mt-1">{judge.name}</div>}
                                        <div className="text-sm text-gray-600 mt-1">
                                          <span className={deliveryStatus.color}>{deliveryStatus.text}</span>
                                          {judge.hasVoted !== undefined && (
                                            <>
                                              <span className="mx-1">•</span>
                                              {judge.hasVoted ? <span className="text-green-600">Voted</span> : <span className="text-gray-500">Not Voted</span>}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={async () => {
                                          if (!confirm(`Remove "${judge.email}"?`)) return;
                                          const token = localStorage.getItem('auth_token');
                                          if (!token || !selectedPollId) return;
                                          try {
                                            const response = await fetch(`/api/v1/admin/polls/${selectedPollId}/judges/${judge.judge_id}`, {
                                              method: 'DELETE',
                                              headers: { Authorization: `Bearer ${token}` },
                                            });
                                            if (!response.ok) throw new Error('Failed');
                                            setPollSuccess('Judge removed');
                                            await fetchPollManagementData(selectedPollId);
                                          } catch (err) {
                                            setPollError('Failed to remove judge');
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

                        {pollManagementTab === 'results' && (
                          <Card className="p-6">
                            <div className="flex justify-between items-center mb-6">
                              <h2 className="text-xl font-semibold text-gray-900">Results</h2>
                              <Link href={`/admin/polls/${selectedPollId}`} target="_blank">
                                <Button variant="outline">View Full Results</Button>
                              </Link>
                            </div>
                            {pollResults ? (
                              <div className="space-y-4">
                                <p className="text-gray-600">Results are available. Click the button above to view detailed results.</p>
                              </div>
                            ) : (
                              <p className="text-gray-600 text-center py-8">No results available yet.</p>
                            )}
                          </Card>
                        )}
                      </>
                    )}
                  </Card>
                </div>
              ) : (
                // Polls List View
                <Card>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Polls</h3>
                      <Link href={`/admin/hackathons/${hackathonId}/polls/create`}>
                        <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white">
                          Create New Poll
                        </Button>
                      </Link>
                    </div>
                    
                    {/* Search and Filter */}
                    <div className="flex gap-3 mb-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Search polls by name..."
                          value={pollsSearch}
                          onChange={(e) => setPollsSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <select
                        value={pollsFilter}
                        onChange={(e) => setPollsFilter(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Polls</option>
                        <option value="active">Active</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="ended">Ended</option>
                      </select>
                    </div>
                  </div>

                  {pollsLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-4 text-gray-600">Loading polls...</p>
                    </div>
                  ) : filteredPolls.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">
                        {polls.length === 0
                          ? 'No polls created yet. Create your first poll to get started.'
                          : 'No polls match your search criteria.'}
                      </p>
                      {polls.length === 0 && (
                        <Link href={`/admin/hackathons/${hackathonId}/polls/create`}>
                          <Button>Create First Poll</Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredPolls.map((poll) => {
                        const status = getPollStatus(poll);
                        return (
                          <div
                            key={poll.poll_id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleSelectPoll(poll.poll_id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900">{poll.name}</h4>
                                  <Badge
                                    variant={
                                      status === 'active'
                                        ? 'success'
                                        : status === 'ended'
                                        ? 'secondary'
                                        : 'warning'
                                    }
                                  >
                                    {status}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                                  <div>
                                    <span className="font-medium">Start:</span>{' '}
                                    {new Date(poll.start_time).toLocaleString()}
                                  </div>
                                  <div>
                                    <span className="font-medium">End:</span>{' '}
                                    {new Date(poll.end_time).toLocaleString()}
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                  <span className="px-2 py-1 bg-gray-100 rounded">
                                    Mode: {poll.voting_mode || 'single'}
                                  </span>
                                  <span className="px-2 py-1 bg-gray-100 rounded">
                                    Permissions: {poll.voting_permissions || 'voters_and_judges'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="secondary" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectPoll(poll.poll_id);
                                  }}
                                >
                                  Manage
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              )}
            </>
          )}
        </div>
      </main>
      
      {/* Poll Management Modals */}
      {showAddTeam && selectedPollId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Add Team</h3>
            <div className="space-y-4">
              <Input
                label="Team Name *"
                value={pollTeamName}
                onChange={(e) => setPollTeamName(e.target.value)}
                placeholder="Enter team name"
              />
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setShowAddTeam(false)}>Cancel</Button>
                <Button onClick={handlePollAddTeam} isLoading={pollSubmitting}>Add Team</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showRegisterVoters && selectedPollId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl p-6 my-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Bulk Register Voters</h3>
            <p className="text-sm text-gray-600 mb-4">Add multiple voters at once. Each voter needs an email and team name.</p>
            <div className="space-y-4">
              {pollVotersList.map((voter, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Input
                      label="Email *"
                      value={voter.email}
                      onChange={(e) => updatePollVoterRow(index, 'email', e.target.value)}
                      placeholder="voter@example.com"
                    />
                  </div>
                  <div className="flex-1 relative team-search-dropdown">
                    <Input
                      label="Team Name *"
                      value={pollTeamSearchQuery[index] !== undefined ? pollTeamSearchQuery[index] : voter.teamName}
                      onChange={(e) => {
                        const query = e.target.value;
                        setPollTeamSearchQuery({ ...pollTeamSearchQuery, [index]: query });
                        setPollTeamSearchOpen({ ...pollTeamSearchOpen, [index]: true });
                        const exactMatch = pollTeams.find(t => t.team_name.toLowerCase() === query.toLowerCase());
                        if (exactMatch) {
                          updatePollVoterRow(index, 'teamName', exactMatch.team_name);
                          setPollTeamSearchQuery({ ...pollTeamSearchQuery, [index]: exactMatch.team_name });
                          setPollTeamSearchOpen({ ...pollTeamSearchOpen, [index]: false });
                        } else {
                          updatePollVoterRow(index, 'teamName', query);
                        }
                      }}
                      onFocus={() => setPollTeamSearchOpen({ ...pollTeamSearchOpen, [index]: true })}
                      placeholder="Search team"
                    />
                    {pollTeamSearchOpen[index] && pollTeams.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {pollTeams.filter(t => !pollTeamSearchQuery[index] || t.team_name.toLowerCase().includes(pollTeamSearchQuery[index].toLowerCase()))
                          .map(team => (
                            <button
                              key={team.team_id}
                              onClick={() => {
                                updatePollVoterRow(index, 'teamName', team.team_name);
                                setPollTeamSearchQuery({ ...pollTeamSearchQuery, [index]: team.team_name });
                                setPollTeamSearchOpen({ ...pollTeamSearchOpen, [index]: false });
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50"
                            >
                              {team.team_name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  {pollVotersList.length > 1 && (
                    <Button variant="ghost" className="mt-7 text-red-600" onClick={() => removePollVoterRow(index)}>×</Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" onClick={addPollVoterRow} className="text-[#0891b2]">+ Add Another Voter</Button>
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setShowRegisterVoters(false)}>Cancel</Button>
                <Button onClick={handlePollRegisterVoters} isLoading={pollSubmitting} className="bg-[#059669]">Register Voters</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showAddJudge && selectedPollId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Add Judge</h3>
            <div className="space-y-4">
              <Input
                label="Email *"
                value={pollJudgeEmail}
                onChange={(e) => setPollJudgeEmail(e.target.value)}
                placeholder="judge@example.com"
              />
              <Input
                label="Name (Optional)"
                value={pollJudgeName}
                onChange={(e) => setPollJudgeName(e.target.value)}
                placeholder="Judge Name"
              />
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setShowAddJudge(false)}>Cancel</Button>
                <Button onClick={handlePollAddJudge} isLoading={pollSubmitting} className="bg-[#1e40af]">Add Judge</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showEditTimeline && selectedPollId && selectedPoll && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Adjust Poll Timeline</h3>
            <div className="space-y-4">
              <DateTimeInput
                label="Start Time"
                id="pollStartTime"
                value={pollStartTime}
                onChange={(value) => setPollStartTime(value)}
                required
              />
              <DateTimeInput
                label="End Time"
                id="pollEndTime"
                value={pollEndTime}
                onChange={(value) => setPollEndTime(value)}
                required
                min={pollStartTime}
              />
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setShowEditTimeline(false)}>Cancel</Button>
                <Button onClick={handlePollUpdateTimeline} isLoading={pollSubmitting}>Update Timeline</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showEditPoll && selectedPollId && selectedPoll && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl p-6 my-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Edit Poll Details</h3>
            <div className="space-y-4">
              <Input label="Poll Name *" value={editPollName} onChange={(e) => setEditPollName(e.target.value)} />
              <div className="grid md:grid-cols-2 gap-4">
                <DateTimeInput
                  label="Start Time"
                  id="editPollStartTime"
                  value={editPollStartTime}
                  onChange={(value) => setEditPollStartTime(value)}
                  required
                />
                <DateTimeInput
                  label="End Time"
                  id="editPollEndTime"
                  value={editPollEndTime}
                  onChange={(value) => setEditPollEndTime(value)}
                  required
                  min={editPollStartTime}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Voting Mode *</label>
                  <select
                    value={editPollVotingMode}
                    onChange={(e) => setEditPollVotingMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  >
                    <option value="single">Single Vote</option>
                    <option value="multiple">Multiple Votes</option>
                    <option value="ranked">Ranked Voting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Voting Permissions *</label>
                  <select
                    value={editPollVotingPermissions}
                    onChange={(e) => setEditPollVotingPermissions(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
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
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Voting Sequence</label>
                    <select
                      value={editPollVotingSequence}
                      onChange={(e) => setEditPollVotingSequence(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    >
                      <option value="simultaneous">Simultaneous</option>
                      <option value="voters_first">Voters First (Judges later)</option>
                    </select>
                  </div>
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
                </>
              )}

              <div className="space-y-4 pt-2">
                <div className="flex items-center">
                  <input
                    id="editPollAllowSelfVote"
                    type="checkbox"
                    checked={editPollAllowSelfVote}
                    onChange={(e) => setEditPollAllowSelfVote(e.target.checked)}
                    className="w-4 h-4 text-[#4F46E5] border-gray-300 rounded focus:ring-[#4F46E5]"
                  />
                  <label htmlFor="editPollAllowSelfVote" className="ml-3 text-sm text-gray-900">
                    Allow self-voting
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="editPollRequireTeamNameGate"
                    type="checkbox"
                    checked={editPollRequireTeamNameGate}
                    onChange={(e) => setEditPollRequireTeamNameGate(e.target.checked)}
                    className="w-4 h-4 text-[#4F46E5] border-gray-300 rounded focus:ring-[#4F46E5]"
                  />
                  <label htmlFor="editPollRequireTeamNameGate" className="ml-3 text-sm text-gray-900">
                    Require team name verification
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="editPollIsPublicResults"
                    type="checkbox"
                    checked={editPollIsPublicResults}
                    onChange={(e) => setEditPollIsPublicResults(e.target.checked)}
                    className="w-4 h-4 text-[#4F46E5] border-gray-300 rounded focus:ring-[#4F46E5]"
                  />
                  <label htmlFor="editPollIsPublicResults" className="ml-3 text-sm text-gray-900">
                    Make results public
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="editPollAllowVoteEditing"
                    type="checkbox"
                    checked={editPollAllowVoteEditing}
                    onChange={(e) => setEditPollAllowVoteEditing(e.target.checked)}
                    className="w-4 h-4 text-[#4F46E5] border-gray-300 rounded focus:ring-[#4F46E5]"
                  />
                  <label htmlFor="editPollAllowVoteEditing" className="ml-3 text-sm text-gray-900">
                    Allow vote editing
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <Input
                  label="Minimum Voter Participation"
                  type="number"
                  min="1"
                  value={editPollMinVoterParticipation}
                  onChange={(e) => setEditPollMinVoterParticipation(e.target.value)}
                  placeholder="Leave empty for no requirement"
                />
                <Input
                  label="Minimum Judge Participation"
                  type="number"
                  min="1"
                  value={editPollMinJudgeParticipation}
                  onChange={(e) => setEditPollMinJudgeParticipation(e.target.value)}
                  placeholder="Leave empty for no requirement"
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setShowEditPoll(false)}>Cancel</Button>
                <Button onClick={handlePollEditPoll} isLoading={pollSubmitting} className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1]">Save Changes</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showEditTeam && pollEditingTeam && selectedPollId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Edit Team</h3>
            <div className="space-y-4">
              <Input
                label="Team Name *"
                value={pollEditTeamName}
                onChange={(e) => setPollEditTeamName(e.target.value)}
                placeholder="Enter team name"
              />
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setShowEditTeam(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!pollEditTeamName.trim()) {
                      setPollError('Team name is required');
                      return;
                    }
                    const token = localStorage.getItem('auth_token');
                    if (!token || !selectedPollId) return;
                    setPollSubmitting(true);
                    try {
                      const response = await fetch(`/api/v1/admin/polls/${selectedPollId}/teams/${pollEditingTeam.team_id}`, {
                        method: 'PATCH',
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ teamName: pollEditTeamName.trim() }),
                      });
                      if (!response.ok) throw new Error('Failed');
                      setPollSuccess('Team updated successfully');
                      setShowEditTeam(false);
                      await fetchPollManagementData(selectedPollId);
                    } catch (err) {
                      setPollError('Failed to update team');
                    } finally {
                      setPollSubmitting(false);
                    }
                  }}
                  isLoading={pollSubmitting}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showReassignVoter && pollReassigningVoter && selectedPollId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Reassign Voter</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Reassigning: {pollReassigningVoter.email}</p>
              <div className="relative team-search-dropdown">
                <Input
                  label="New Team *"
                  value={pollReassignTeamSearchQuery}
                  onChange={(e) => {
                    const query = e.target.value;
                    setPollReassignTeamSearchQuery(query);
                    setPollReassignTeamSearchOpen(true);
                    const exactMatch = pollTeams.find(t => t.team_name.toLowerCase() === query.toLowerCase());
                    if (exactMatch) {
                      setPollSelectedReassignTeam(exactMatch.team_id);
                      setPollReassignTeamSearchQuery(exactMatch.team_name);
                      setPollReassignTeamSearchOpen(false);
                    }
                  }}
                  onFocus={() => setPollReassignTeamSearchOpen(true)}
                  placeholder="Search team"
                />
                {pollReassignTeamSearchOpen && pollTeams.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {pollTeams.filter(t => !pollReassignTeamSearchQuery || t.team_name.toLowerCase().includes(pollReassignTeamSearchQuery.toLowerCase()))
                      .map(team => (
                        <button
                          key={team.team_id}
                          onClick={() => {
                            setPollSelectedReassignTeam(team.team_id);
                            setPollReassignTeamSearchQuery(team.team_name);
                            setPollReassignTeamSearchOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50"
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
                    if (!pollSelectedReassignTeam) {
                      setPollError('Please select a team');
                      return;
                    }
                    const token = localStorage.getItem('auth_token');
                    if (!token || !selectedPollId) return;
                    setPollSubmitting(true);
                    try {
                      const response = await fetch(`/api/v1/admin/polls/${selectedPollId}/voters/${pollReassigningVoter.tokenId || pollReassigningVoter.token_id}/reassign`, {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ teamId: pollSelectedReassignTeam }),
                      });
                      if (!response.ok) throw new Error('Failed');
                      setPollSuccess('Voter reassigned successfully');
                      setShowReassignVoter(false);
                      await fetchPollManagementData(selectedPollId);
                    } catch (err) {
                      setPollError('Failed to reassign voter');
                    } finally {
                      setPollSubmitting(false);
                    }
                  }}
                  isLoading={pollSubmitting}
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
 * Hackathon detail page (wrapped in Suspense to handle useSearchParams)
 */
export default function HackathonDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-[#64748B]">Loading...</div>
      </div>
    }>
      <HackathonDetailPageContent />
    </Suspense>
  );
}
