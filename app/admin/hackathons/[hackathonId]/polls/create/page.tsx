'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Input } from '@/components/ui';
import DateTimeInput from '@/components/ui/DateTimeInput';
import { Sidebar } from '@/components/layouts';


/**
 * Create poll page within a hackathon
 */
export default function CreatePollPage() {
  const router = useRouter();
  const params = useParams();
  const hackathonId = params.hackathonId as string;

  // Compute sensible default times (start in 1 hour, end in 7 days).
  // These are used to initialise the form so that both date and time
  // are editable immediately without triggering validation errors.
  const now = new Date();
  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
  const defaultEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    // Pre-populate with default values so both date and time can be edited.
    startTime: defaultStart,
    endTime: defaultEnd,
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
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }

    const parsed = JSON.parse(adminData);
    setAdmin(parsed);

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

      // Redirect back to hackathon page with polls tab active for seamless flow
      router.push(`/admin/hackathons/${hackathonId}?tab=polls`);
    } catch (err) {
      console.error('Create poll error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link
              href={`/admin/hackathons/${hackathonId}`}
              className="text-[#4F46E5] hover:text-[#4338CA] text-sm font-medium flex items-center gap-1 mb-2"
            >
              ← Back to Hackathon
            </Link>
            <h1 className="text-3xl font-bold text-[#0F172A]">Create New Poll</h1>
            {hackathon && (
              <p className="text-[#64748B] mt-1">For hackathon: <span className="font-medium text-[#0F172A]">{hackathon.name}</span></p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Poll Name *"
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Best Project Award"
              />

              <div className="grid md:grid-cols-2 gap-6">
                <DateTimeInput
                  label="Start Time"
                  id="startTime"
                  value={formData.startTime}
                  onChange={(value) => setFormData({ ...formData, startTime: value })}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />

                <DateTimeInput
                  label="End Time"
                  id="endTime"
                  value={formData.endTime}
                  onChange={(value) => setFormData({ ...formData, endTime: value })}
                  required
                  min={formData.startTime || new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div>
                <label htmlFor="votingMode" className="block text-sm font-medium text-[#334155] mb-2">
                  Voting Mode *
                </label>
                <div className="relative">
                  <select
                    id="votingMode"
                    value={formData.votingMode}
                    onChange={(e) => setFormData({ ...formData, votingMode: e.target.value as any, maxRankedPositions: e.target.value !== 'ranked' ? '' : formData.maxRankedPositions })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] bg-white appearance-none"
                  >
                    <option value="single">Single Vote (one team per voter)</option>
                    <option value="multiple">Multiple Votes (vote for multiple teams)</option>
                    <option value="ranked">Ranked Voting (rank teams 1, 2, 3...)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">▼</div>
                </div>
              </div>

              {/* Max Ranked Positions - Only for ranked voting */}
              {formData.votingMode === 'ranked' && (
                <Input
                  label="Maximum Positions to Rank (Optional)"
                  id="maxRankedPositions"
                  type="number"
                  min="1"
                  value={formData.maxRankedPositions}
                  onChange={(e) => setFormData({ ...formData, maxRankedPositions: e.target.value })}
                  placeholder="Leave empty to rank all teams"
                  helperText="Limit how many positions voters/judges can rank (e.g., '3' means rank top 3 only). Leave empty to allow ranking all teams."
                />
              )}

              <div>
                <label htmlFor="votingPermissions" className="block text-sm font-medium text-[#334155] mb-2">
                  Voting Permissions *
                </label>
                <div className="relative">
                  <select
                    id="votingPermissions"
                    value={formData.votingPermissions}
                    onChange={(e) => setFormData({ ...formData, votingPermissions: e.target.value as any })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] bg-white appearance-none"
                  >
                    <option value="voters_only">Voters Only</option>
                    <option value="judges_only">Judges Only</option>
                    <option value="voters_and_judges">Voters and Judges</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">▼</div>
                </div>
              </div>

              {formData.votingPermissions === 'voters_and_judges' && (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      label="Voter Weight"
                      id="voterWeight"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.voterWeight}
                      onChange={(e) => setFormData({ ...formData, voterWeight: e.target.value })}
                      helperText="Weight multiplier for voter votes"
                    />

                    <Input
                      label="Judge Weight"
                      id="judgeWeight"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.judgeWeight}
                      onChange={(e) => setFormData({ ...formData, judgeWeight: e.target.value })}
                      helperText="Weight multiplier for judge votes"
                    />
                  </div>

                  {/* Voting Sequence - Only when both voters and judges can vote */}
                  <div>
                    <label htmlFor="votingSequence" className="block text-sm font-medium text-[#334155] mb-2">
                      Voting Sequence *
                    </label>
                    <div className="relative">
                      <select
                        id="votingSequence"
                        value={formData.votingSequence}
                        onChange={(e) => setFormData({ ...formData, votingSequence: e.target.value as any })}
                        className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] bg-white appearance-none"
                      >
                        <option value="simultaneous">Simultaneous (voters and judges can vote at the same time)</option>
                        <option value="voters_first">Voters First (judges must wait until all voters have voted)</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">▼</div>
                    </div>
                    <p className="text-xs text-[#64748B] mt-1.5">
                      {formData.votingSequence === 'voters_first'
                        ? 'Judges will be blocked from voting until all registered voters have completed their votes.'
                        : 'Both voters and judges can vote at any time during the poll period.'}
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-4 pt-2">
                <div className="flex items-center">
                  <input
                    id="allowSelfVote"
                    type="checkbox"
                    checked={formData.allowSelfVote}
                    onChange={(e) => setFormData({ ...formData, allowSelfVote: e.target.checked })}
                    className="w-4 h-4 text-[#4F46E5] border-[#94a3b8] rounded focus:ring-[#4F46E5]"
                  />
                  <label htmlFor="allowSelfVote" className="ml-3 text-sm text-[#334155]">
                    Allow self-voting (voters can vote for their own team)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="requireTeamNameGate"
                    type="checkbox"
                    checked={formData.requireTeamNameGate}
                    onChange={(e) => setFormData({ ...formData, requireTeamNameGate: e.target.checked })}
                    className="w-4 h-4 text-[#4F46E5] border-[#94a3b8] rounded focus:ring-[#4F46E5]"
                  />
                  <label htmlFor="requireTeamNameGate" className="ml-3 text-sm text-[#334155]">
                    Require team name verification (voters must enter their team name)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="isPublicResults"
                    type="checkbox"
                    checked={formData.isPublicResults}
                    onChange={(e) => setFormData({ ...formData, isPublicResults: e.target.checked })}
                    className="w-4 h-4 text-[#4F46E5] border-[#94a3b8] rounded focus:ring-[#4F46E5]"
                  />
                  <label htmlFor="isPublicResults" className="ml-3 text-sm text-[#334155]">
                    Make results public (anyone can view results without authentication)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="allowVoteEditing"
                    type="checkbox"
                    checked={formData.allowVoteEditing}
                    onChange={(e) => setFormData({ ...formData, allowVoteEditing: e.target.checked })}
                    className="w-4 h-4 text-[#4F46E5] border-[#94a3b8] rounded focus:ring-[#4F46E5]"
                  />
                  <label htmlFor="allowVoteEditing" className="ml-3 text-sm text-[#334155]">
                    Allow vote editing (voters and judges can change their votes after submission)
                  </label>
                </div>
              </div>

              {/* Quorum Requirements */}
              <div className="space-y-6 pt-6 border-t border-[#E2E8F0]">
                <div>
                  <h3 className="text-lg font-semibold text-[#0F172A]">Quorum Requirements</h3>
                  <p className="text-sm text-[#64748B]">
                    Set minimum participation thresholds. Leave empty for no requirement.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="Minimum Voter Participation"
                    id="minVoterParticipation"
                    type="number"
                    min="1"
                    value={formData.minVoterParticipation}
                    onChange={(e) => setFormData({ ...formData, minVoterParticipation: e.target.value })}
                    placeholder="Leave empty for no requirement"
                    helperText="Minimum number of voters who must vote for results to be valid"
                  />

                  <Input
                    label="Minimum Judge Participation"
                    id="minJudgeParticipation"
                    type="number"
                    min="1"
                    value={formData.minJudgeParticipation}
                    onChange={(e) => setFormData({ ...formData, minJudgeParticipation: e.target.value })}
                    placeholder="Leave empty for no requirement"
                    helperText="Minimum number of judges who must vote for results to be valid"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  isLoading={loading}
                  className="flex-1"
                >
                  Create Poll
                </Button>
                <Link
                  href={`/admin/hackathons/${hackathonId}`}
                  className="flex-1"
                >
                  <Button variant="secondary" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}

