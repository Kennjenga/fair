'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Voting portal page content
 */
function VotePageContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [step, setStep] = useState<'token' | 'verify' | 'vote' | 'confirm'>('token');
  const [token, setToken] = useState(tokenFromUrl || '');
  const [teamName, setTeamName] = useState('');
  
  // Voting state - supports all three modes
  const [selectedTeamId, setSelectedTeamId] = useState(''); // Single mode
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]); // Multiple mode
  const [rankings, setRankings] = useState<Array<{ teamId: string; rank: number; reason?: string }>>([]); // Ranked mode
  
  const [pollData, setPollData] = useState<any>(null);
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [voterTeam, setVoterTeam] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [voteResult, setVoteResult] = useState<any>(null);
  const [existingVote, setExistingVote] = useState<any>(null);

  useEffect(() => {
    if (tokenFromUrl) {
      handleTokenSubmit();
    }
  }, []);

  const handleTokenSubmit = async () => {
    if (!token) {
      setError('Please enter your voting token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/vote/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid token');
        setLoading(false);
        return;
      }

      // Check if user has already voted
      if (data.alreadyVoted && data.existingVote) {
        setPollData(data.poll);
        setAvailableTeams(data.availableTeams || []);
        setVoterTeam(data.voterTeam);
        setExistingVote(data.existingVote);
        setStep('confirm');
        setVoteResult({
          ...data.existingVote,
          alreadyVoted: true,
        });
        setLoading(false);
        return;
      }

      setPollData(data.poll);
      setAvailableTeams(data.availableTeams || []);
      setVoterTeam(data.voterTeam);
      setExistingVote(null);

      if (data.poll.requireTeamNameGate) {
        setStep('verify');
      } else {
        setStep('vote');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamNameVerify = () => {
    if (!teamName || teamName !== voterTeam?.teamName) {
      setError('Team name does not match. Please try again.');
      return;
    }
    setError('');
    setStep('vote');
  };

  // Handle multiple vote selection
  const handleMultipleTeamToggle = (teamId: string) => {
    setSelectedTeams(prev => {
      if (prev.includes(teamId)) {
        return prev.filter(id => id !== teamId);
      } else {
        return [...prev, teamId];
      }
    });
  };

  // Handle ranked voting - update rank for a team
  const handleRankChange = (teamId: string, rank: number) => {
    setRankings(prev => {
      // Remove team from any existing rank
      const filtered = prev.filter(r => r.teamId !== teamId);
      // Add with new rank
      return [...filtered, { teamId, rank }].sort((a, b) => a.rank - b.rank);
    });
  };

  // Handle ranked voting - update reason
  const handleReasonChange = (teamId: string, reason: string) => {
    setRankings(prev => {
      const existing = prev.find(r => r.teamId === teamId);
      if (existing) {
        return prev.map(r => r.teamId === teamId ? { ...r, reason } : r);
      }
      return prev;
    });
  };

  const handleVoteSubmit = async () => {
    setLoading(true);
    setError('');

    let votePayload: any = {
      token,
      teamName: voterTeam?.teamName,
    };

    // Build payload based on voting mode
    if (pollData?.votingMode === 'single') {
      if (!selectedTeamId) {
        setError('Please select a team to vote for');
        setLoading(false);
        return;
      }
      votePayload.teamIdTarget = selectedTeamId;
    } else if (pollData?.votingMode === 'multiple') {
      if (selectedTeams.length === 0) {
        setError('Please select at least one team to vote for');
        setLoading(false);
        return;
      }
      votePayload.teams = selectedTeams;
    } else if (pollData?.votingMode === 'ranked') {
      if (rankings.length === 0) {
        setError('Please rank at least one team');
        setLoading(false);
        return;
      }
      // Ensure all ranks are unique and sequential
      const ranks = rankings.map(r => r.rank).sort((a, b) => a - b);
      const uniqueRanks = new Set(ranks);
      if (ranks.length !== uniqueRanks.size) {
        setError('Each team must have a unique rank');
        setLoading(false);
        return;
      }
      votePayload.rankings = rankings;
    }

    try {
      const response = await fetch('/api/v1/vote/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(votePayload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit vote');
        setLoading(false);
        return;
      }

      // Check if this is an existing vote response
      if (data.alreadyVoted && data.existingVote) {
        setVoteResult({
          ...data.existingVote,
          alreadyVoted: true,
        });
      } else {
        setVoteResult(data);
      }
      setStep('confirm');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = () => {
    if (pollData?.votingMode === 'single') {
      return !!selectedTeamId;
    } else if (pollData?.votingMode === 'multiple') {
      return selectedTeams.length > 0;
    } else if (pollData?.votingMode === 'ranked') {
      return rankings.length > 0;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e40af] via-[#0891b2] to-[#059669] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1e40af] mb-2">
              FAIR Voting Portal
            </h1>
            <p className="text-[#64748b]">Cast your anonymous vote</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Step 1: Token Entry */}
          {step === 'token' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-[#0f172a] mb-1">
                  Voting Token
                </label>
                <input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                  placeholder="Enter your voting token"
                />
                <p className="text-sm text-[#64748b] mt-1">
                  Check your email for your unique voting token
                </p>
              </div>
              <button
                onClick={handleTokenSubmit}
                disabled={loading}
                className="w-full bg-[#1e40af] text-white py-2 rounded-lg font-semibold hover:bg-[#1e3a8a] transition-colors disabled:opacity-50"
              >
                {loading ? 'Validating...' : 'Continue'}
              </button>
            </div>
          )}

          {/* Step 2: Team Name Verification */}
          {step === 'verify' && (
            <div className="space-y-4">
              <p className="text-[#0f172a] mb-4">
                Please enter your team name to verify your identity:
              </p>
              <div>
                <label htmlFor="teamName" className="block text-sm font-medium text-[#0f172a] mb-1">
                  Your Team Name
                </label>
                <input
                  id="teamName"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                  placeholder="Enter your team name"
                />
              </div>
              <button
                onClick={handleTeamNameVerify}
                className="w-full bg-[#0891b2] text-white py-2 rounded-lg font-semibold hover:bg-[#0e7490] transition-colors"
              >
                Verify
              </button>
            </div>
          )}

          {/* Step 3: Vote Selection - Single Mode */}
          {step === 'vote' && pollData?.votingMode === 'single' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-[#0f172a] mb-2">
                  {pollData?.name}
                </h2>
                <p className="text-[#64748b] mb-4">
                  Select the team you want to vote for.
                  {!pollData?.allowSelfVote && ' You cannot vote for your own team.'}
                </p>
              </div>

              <div className="space-y-2">
                {availableTeams.map((team) => (
                  <label
                    key={team.teamId}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedTeamId === team.teamId
                        ? 'border-[#1e40af] bg-blue-50'
                        : 'border-[#e2e8f0] hover:border-[#94a3b8]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="team"
                      value={team.teamId}
                      checked={selectedTeamId === team.teamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="mr-3"
                    />
                    <span className="font-medium text-[#0f172a]">{team.teamName}</span>
                  </label>
                ))}
              </div>

              <button
                onClick={handleVoteSubmit}
                disabled={loading || !canSubmit()}
                className="w-full bg-[#059669] text-white py-2 rounded-lg font-semibold hover:bg-[#047857] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting Vote...' : 'Submit Vote'}
              </button>
            </div>
          )}

          {/* Step 3: Vote Selection - Multiple Mode */}
          {step === 'vote' && pollData?.votingMode === 'multiple' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-[#0f172a] mb-2">
                  {pollData?.name}
                </h2>
                <p className="text-[#64748b] mb-4">
                  Select all teams you want to vote for. You can vote for multiple teams.
                  {!pollData?.allowSelfVote && ' You cannot vote for your own team.'}
                </p>
              </div>

              <div className="space-y-2">
                {availableTeams.map((team) => (
                  <label
                    key={team.teamId}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedTeams.includes(team.teamId)
                        ? 'border-[#1e40af] bg-blue-50'
                        : 'border-[#e2e8f0] hover:border-[#94a3b8]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTeams.includes(team.teamId)}
                      onChange={() => handleMultipleTeamToggle(team.teamId)}
                      className="mr-3"
                    />
                    <span className="font-medium text-[#0f172a]">{team.teamName}</span>
                  </label>
                ))}
              </div>

              <button
                onClick={handleVoteSubmit}
                disabled={loading || !canSubmit()}
                className="w-full bg-[#059669] text-white py-2 rounded-lg font-semibold hover:bg-[#047857] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting Vote...' : 'Submit Vote'}
              </button>
            </div>
          )}

          {/* Step 3: Vote Selection - Ranked Mode */}
          {step === 'vote' && pollData?.votingMode === 'ranked' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-[#0f172a] mb-2">
                  {pollData?.name}
                </h2>
                <p className="text-[#64748b] mb-4">
                  Rank the teams from best to worst. Assign rank 1 to your top choice, rank 2 to your second choice, and so on.
                  {!pollData?.allowSelfVote && ' You cannot rank your own team.'}
                </p>
              </div>

              <div className="space-y-4">
                {availableTeams.map((team) => {
                  const ranking = rankings.find(r => r.teamId === team.teamId);
                  return (
                    <div
                      key={team.teamId}
                      className="p-4 border-2 border-[#e2e8f0] rounded-lg"
                    >
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-24">
                          <label className="block text-sm font-medium text-[#0f172a] mb-1">
                            Rank
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={availableTeams.length}
                            value={ranking?.rank || ''}
                            onChange={(e) => {
                              const rank = parseInt(e.target.value);
                              if (!isNaN(rank) && rank > 0) {
                                handleRankChange(team.teamId, rank);
                              } else if (e.target.value === '') {
                                setRankings(prev => prev.filter(r => r.teamId !== team.teamId));
                              }
                            }}
                            className="w-full px-2 py-1 border border-[#94a3b8] rounded focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                            placeholder="Rank"
                          />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-[#0f172a]">{team.teamName}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#0f172a] mb-1">
                          Reason (Optional)
                        </label>
                        <textarea
                          value={ranking?.reason || ''}
                          onChange={(e) => handleReasonChange(team.teamId, e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1 border border-[#94a3b8] rounded focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                          placeholder="Why did you rank this team here?"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleVoteSubmit}
                disabled={loading || !canSubmit()}
                className="w-full bg-[#059669] text-white py-2 rounded-lg font-semibold hover:bg-[#047857] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting Vote...' : 'Submit Vote'}
              </button>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 'confirm' && voteResult && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-6xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-[#059669] mb-2">
                  {voteResult.alreadyVoted ? 'Your Vote' : 'Vote Submitted Successfully!'}
                </h2>
                <p className="text-[#64748b] mb-6">
                  {voteResult.alreadyVoted 
                    ? 'You have already voted. Here is your vote record.'
                    : 'Your vote has been recorded on the blockchain.'}
                </p>
              </div>

              {/* Vote Details */}
              {pollData && (
                <div className="bg-[#f8fafc] rounded-lg p-4 mb-4 text-left">
                  <h3 className="font-semibold text-[#0f172a] mb-3">Vote Details</h3>
                  
                  {/* Single Vote Mode */}
                  {voteResult.votingMode === 'single' && voteResult.teamIdTarget && (
                    <div>
                      <p className="text-sm text-[#64748b] mb-1">Selected Team:</p>
                      <p className="text-[#0f172a] font-medium">
                        {availableTeams.find(t => t.teamId === voteResult.teamIdTarget)?.teamName || voteResult.teamIdTarget}
                      </p>
                    </div>
                  )}

                  {/* Multiple Vote Mode */}
                  {voteResult.votingMode === 'multiple' && voteResult.teams && voteResult.teams.length > 0 && (
                    <div>
                      <p className="text-sm text-[#64748b] mb-2">Selected Teams ({voteResult.teams.length}):</p>
                      <ul className="list-disc list-inside space-y-1">
                        {voteResult.teams.map((teamId: string) => (
                          <li key={teamId} className="text-[#0f172a]">
                            {availableTeams.find(t => t.teamId === teamId)?.teamName || teamId}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Ranked Vote Mode */}
                  {voteResult.votingMode === 'ranked' && voteResult.rankings && voteResult.rankings.length > 0 && (
                    <div>
                      <p className="text-sm text-[#64748b] mb-2">Rankings:</p>
                      <div className="space-y-2">
                        {voteResult.rankings
                          .sort((a: any, b: any) => a.rank - b.rank)
                          .map((ranking: any) => (
                            <div key={ranking.teamId} className="flex items-center justify-between p-2 bg-white rounded border border-[#e2e8f0]">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-[#1e40af] text-white flex items-center justify-center text-xs font-bold">
                                  {ranking.rank}
                                </div>
                                <span className="text-[#0f172a]">
                                  {availableTeams.find(t => t.teamId === ranking.teamId)?.teamName || ranking.teamId}
                                </span>
                                {ranking.reason && (
                                  <span className="text-xs text-[#64748b] ml-2">({ranking.reason})</span>
                                )}
                              </div>
                              <span className="text-sm font-semibold text-[#1e40af]">{ranking.points || 0} pts</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {voteResult.timestamp && (
                    <div className="mt-3 pt-3 border-t border-[#e2e8f0]">
                      <p className="text-xs text-[#64748b]">
                        Voted on: {new Date(voteResult.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Transaction Hash */}
              {voteResult.txHash && (
                <div className="bg-[#f8fafc] rounded-lg p-4 mb-4 text-center">
                  <p className="text-sm text-[#64748b] mb-2">Transaction Hash:</p>
                  <code className="text-xs text-[#0f172a] break-all block mb-2">{voteResult.txHash}</code>
                  {voteResult.explorerUrl && (
                    <a
                      href={voteResult.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0891b2] hover:text-[#0e7490] text-sm"
                    >
                      View on Avalanche Explorer →
                    </a>
                  )}
                </div>
              )}

              <div className="text-center">
                <Link
                  href="/"
                  className="inline-block bg-[#1e40af] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#1e3a8a] transition-colors"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          )}

          {step !== 'confirm' && (
            <div className="mt-6 text-center">
              <Link href="/" className="text-[#0891b2] hover:text-[#0e7490] text-sm">
                ← Back to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Voting portal page with Suspense boundary
 */
export default function VotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#1e40af] via-[#0891b2] to-[#059669] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <VotePageContent />
    </Suspense>
  );
}
