'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Create poll page within a hackathon
 */
export default function CreatePollPage() {
  const router = useRouter();
  const params = useParams();
  const hackathonId = params.hackathonId as string;
  
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    votingMode: 'single' as 'single' | 'multiple' | 'ranked',
    votingPermissions: 'voters_and_judges' as 'voters_only' | 'judges_only' | 'voters_and_judges',
    voterWeight: '1.0',
    judgeWeight: '1.0',
    allowSelfVote: false,
    requireTeamNameGate: true,
    isPublicResults: false,
    maxRankedPositions: '' as string | '',
    votingSequence: 'simultaneous' as 'simultaneous' | 'voters_first',
    allowVoteEditing: false,
    minVoterParticipation: '' as string | '',
    minJudgeParticipation: '' as string | '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hackathon, setHackathon] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    // Fetch hackathon info
    fetch(`/api/v1/admin/hackathons/${hackathonId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setHackathon(data.hackathon))
      .catch(err => console.error('Failed to fetch hackathon:', err));
  }, [hackathonId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    // Validate dates before sending
    if (!formData.startTime || !formData.endTime) {
      setError('Start time and end time are required');
      setLoading(false);
      return;
    }

    const startDate = new Date(formData.startTime);
    const endDate = new Date(formData.endTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setError('Invalid date format');
      setLoading(false);
      return;
    }

    if (endDate <= startDate) {
      setError('End time must be after start time');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/v1/admin/polls', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hackathonId,
          name: formData.name,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          votingMode: formData.votingMode,
          votingPermissions: formData.votingPermissions,
          voterWeight: parseFloat(formData.voterWeight),
          judgeWeight: parseFloat(formData.judgeWeight),
          allowSelfVote: formData.allowSelfVote,
          requireTeamNameGate: formData.requireTeamNameGate,
          isPublicResults: formData.isPublicResults,
          allowVoteEditing: formData.allowVoteEditing,
          minVoterParticipation: formData.minVoterParticipation ? parseInt(formData.minVoterParticipation) : null,
          minJudgeParticipation: formData.minJudgeParticipation ? parseInt(formData.minJudgeParticipation) : null,
          maxRankedPositions: formData.votingMode === 'ranked' && formData.maxRankedPositions 
            ? parseInt(formData.maxRankedPositions, 10) 
            : null,
          votingSequence: formData.votingSequence,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = data.error || 'Failed to create poll';
        if (data.details && typeof data.details === 'object') {
          if (data.details.issues && Array.isArray(data.details.issues)) {
            errorMessage = data.details.issues.map((issue: any) => issue.message).join(', ');
          }
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Redirect to poll management page
      router.push(`/admin/polls/${data.poll.poll_id}`);
    } catch (err) {
      console.error('Create poll error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin');
    router.push('/admin/login');
  };

  // Get default times (now and 7 days from now)
  const now = new Date();
  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
  const defaultEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b border-[#e2e8f0]">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin/dashboard" className="text-2xl font-bold text-[#1e40af]">
            FAIR Admin Dashboard
          </Link>
          <div className="flex items-center gap-4">
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
        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <Link
              href={`/admin/hackathons/${hackathonId}`}
              className="text-[#1e40af] hover:text-[#1e3a8a]"
            >
              ← Back to Hackathon
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-[#0f172a] mb-2">Create New Poll</h1>
          {hackathon && (
            <p className="text-[#64748b] mb-6">For hackathon: {hackathon.name}</p>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#0f172a] mb-1">
                  Poll Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                  placeholder="e.g., Best Project Award"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-[#0f172a] mb-1">
                    Start Time *
                  </label>
                  <input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime || defaultStart}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                  />
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-[#0f172a] mb-1">
                    End Time *
                  </label>
                  <input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime || defaultEnd}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="votingMode" className="block text-sm font-medium text-[#0f172a] mb-1">
                  Voting Mode *
                </label>
                <select
                  id="votingMode"
                  value={formData.votingMode}
                  onChange={(e) => setFormData({ ...formData, votingMode: e.target.value as any, maxRankedPositions: e.target.value !== 'ranked' ? '' : formData.maxRankedPositions })}
                  required
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                >
                  <option value="single">Single Vote (one team per voter)</option>
                  <option value="multiple">Multiple Votes (vote for multiple teams)</option>
                  <option value="ranked">Ranked Voting (rank teams 1, 2, 3...)</option>
                </select>
              </div>

              {/* Max Ranked Positions - Only for ranked voting */}
              {formData.votingMode === 'ranked' && (
                <div>
                  <label htmlFor="maxRankedPositions" className="block text-sm font-medium text-[#0f172a] mb-1">
                    Maximum Positions to Rank (Optional)
                  </label>
                  <input
                    id="maxRankedPositions"
                    type="number"
                    min="1"
                    value={formData.maxRankedPositions}
                    onChange={(e) => setFormData({ ...formData, maxRankedPositions: e.target.value })}
                    className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                    placeholder="Leave empty to rank all teams"
                  />
                  <p className="text-xs text-[#64748b] mt-1">
                    Limit how many positions voters/judges can rank (e.g., "3" means rank top 3 only). Leave empty to allow ranking all teams.
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="votingPermissions" className="block text-sm font-medium text-[#0f172a] mb-1">
                  Voting Permissions *
                </label>
                <select
                  id="votingPermissions"
                  value={formData.votingPermissions}
                  onChange={(e) => setFormData({ ...formData, votingPermissions: e.target.value as any })}
                  required
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                >
                  <option value="voters_only">Voters Only</option>
                  <option value="judges_only">Judges Only</option>
                  <option value="voters_and_judges">Voters and Judges</option>
                </select>
              </div>

              {formData.votingPermissions === 'voters_and_judges' && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="voterWeight" className="block text-sm font-medium text-[#0f172a] mb-1">
                        Voter Weight
                      </label>
                      <input
                        id="voterWeight"
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.voterWeight}
                        onChange={(e) => setFormData({ ...formData, voterWeight: e.target.value })}
                        className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                      />
                      <p className="text-xs text-[#64748b] mt-1">Weight multiplier for voter votes</p>
                    </div>

                    <div>
                      <label htmlFor="judgeWeight" className="block text-sm font-medium text-[#0f172a] mb-1">
                        Judge Weight
                      </label>
                      <input
                        id="judgeWeight"
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.judgeWeight}
                        onChange={(e) => setFormData({ ...formData, judgeWeight: e.target.value })}
                        className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                      />
                      <p className="text-xs text-[#64748b] mt-1">Weight multiplier for judge votes</p>
                    </div>
                  </div>

                  {/* Voting Sequence - Only when both voters and judges can vote */}
                  <div>
                    <label htmlFor="votingSequence" className="block text-sm font-medium text-[#0f172a] mb-1">
                      Voting Sequence *
                    </label>
                    <select
                      id="votingSequence"
                      value={formData.votingSequence}
                      onChange={(e) => setFormData({ ...formData, votingSequence: e.target.value as any })}
                      className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                    >
                      <option value="simultaneous">Simultaneous (voters and judges can vote at the same time)</option>
                      <option value="voters_first">Voters First (judges must wait until all voters have voted)</option>
                    </select>
                    <p className="text-xs text-[#64748b] mt-1">
                      {formData.votingSequence === 'voters_first' 
                        ? 'Judges will be blocked from voting until all registered voters have completed their votes.'
                        : 'Both voters and judges can vote at any time during the poll period.'}
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="allowSelfVote"
                    type="checkbox"
                    checked={formData.allowSelfVote}
                    onChange={(e) => setFormData({ ...formData, allowSelfVote: e.target.checked })}
                    className="w-4 h-4 text-[#1e40af] border-[#94a3b8] rounded focus:ring-[#1e40af]"
                  />
                  <label htmlFor="allowSelfVote" className="ml-2 text-sm text-[#0f172a]">
                    Allow self-voting (voters can vote for their own team)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="requireTeamNameGate"
                    type="checkbox"
                    checked={formData.requireTeamNameGate}
                    onChange={(e) => setFormData({ ...formData, requireTeamNameGate: e.target.checked })}
                    className="w-4 h-4 text-[#1e40af] border-[#94a3b8] rounded focus:ring-[#1e40af]"
                  />
                  <label htmlFor="requireTeamNameGate" className="ml-2 text-sm text-[#0f172a]">
                    Require team name verification (voters must enter their team name)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="isPublicResults"
                    type="checkbox"
                    checked={formData.isPublicResults}
                    onChange={(e) => setFormData({ ...formData, isPublicResults: e.target.checked })}
                    className="w-4 h-4 text-[#1e40af] border-[#94a3b8] rounded focus:ring-[#1e40af]"
                  />
                  <label htmlFor="isPublicResults" className="ml-2 text-sm text-[#0f172a]">
                    Make results public (anyone can view results without authentication)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="allowVoteEditing"
                    type="checkbox"
                    checked={formData.allowVoteEditing}
                    onChange={(e) => setFormData({ ...formData, allowVoteEditing: e.target.checked })}
                    className="w-4 h-4 text-[#1e40af] border-[#94a3b8] rounded focus:ring-[#1e40af]"
                  />
                  <label htmlFor="allowVoteEditing" className="ml-2 text-sm text-[#0f172a]">
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
                  <label htmlFor="minVoterParticipation" className="block text-sm font-medium text-[#0f172a] mb-1">
                    Minimum Voter Participation
                  </label>
                  <input
                    id="minVoterParticipation"
                    type="number"
                    min="1"
                    value={formData.minVoterParticipation}
                    onChange={(e) => setFormData({ ...formData, minVoterParticipation: e.target.value })}
                    className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                    placeholder="Leave empty for no requirement"
                  />
                  <p className="text-xs text-[#64748b] mt-1">
                    Minimum number of voters who must vote for results to be valid
                  </p>
                </div>

                <div>
                  <label htmlFor="minJudgeParticipation" className="block text-sm font-medium text-[#0f172a] mb-1">
                    Minimum Judge Participation
                  </label>
                  <input
                    id="minJudgeParticipation"
                    type="number"
                    min="1"
                    value={formData.minJudgeParticipation}
                    onChange={(e) => setFormData({ ...formData, minJudgeParticipation: e.target.value })}
                    className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                    placeholder="Leave empty for no requirement"
                  />
                  <p className="text-xs text-[#64748b] mt-1">
                    Minimum number of judges who must vote for results to be valid
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#1e40af] text-white py-2 rounded-lg font-semibold hover:bg-[#1e3a8a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Poll'}
                </button>
                <Link
                  href={`/admin/hackathons/${hackathonId}`}
                  className="flex-1 bg-[#64748b] text-white py-2 rounded-lg font-semibold hover:bg-[#475569] transition-colors text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

