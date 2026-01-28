'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button, Input, Alert, Logo, LoadingSpinner } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';

/**
 * Voting portal page content with modern design
 */
function VotePageContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const pollIdFromUrl = searchParams.get('pollId');
  const judgeEmailFromUrl = searchParams.get('judgeEmail');

  // Determine if this is a voter or judge
  const isJudge = !!(pollIdFromUrl && judgeEmailFromUrl);
  const isVoter = !!tokenFromUrl;

  const [step, setStep] = useState<'token' | 'verify' | 'vote' | 'confirm'>('token');
  const [token, setToken] = useState(tokenFromUrl || '');
  const [teamName, setTeamName] = useState('');
  const [showProjectInfo, setShowProjectInfo] = useState(false);

  // Voting state - supports all three modes
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [rankings, setRankings] = useState<Array<{ teamId: string; rank: number; reason?: string }>>([]);

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
    } else if (pollIdFromUrl && judgeEmailFromUrl) {
      handleJudgeValidate();
    }
  }, []);

  const handleJudgeValidate = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/vote/validate-judge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pollId: pollIdFromUrl, judgeEmail: judgeEmailFromUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid judge access');
        setLoading(false);
        return;
      }

      if (data.alreadyVoted && data.existingVote) {
        setPollData(data.poll);
        setAvailableTeams(data.availableTeams || []);
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
      setExistingVote(null);
      setStep('vote');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

      // Team is automatically verified from token - skip verification step
      setStep('vote');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleMultipleTeamToggle = (teamId: string) => {
    setSelectedTeams(prev => {
      if (prev.includes(teamId)) {
        return prev.filter(id => id !== teamId);
      } else {
        return [...prev, teamId];
      }
    });
  };

  const handleRankChange = (teamId: string, rank: number) => {
    setRankings(prev => {
      const filtered = prev.filter(r => r.teamId !== teamId);
      return [...filtered, { teamId, rank }].sort((a, b) => a.rank - b.rank);
    });
  };

  const handleReasonChange = (teamId: string, reason: string) => {
    setRankings(prev => {
      const existing = prev.find(r => r.teamId === teamId);
      if (existing) {
        return prev.map(r => r.teamId === teamId ? { ...r, reason } : r);
      }
      return prev;
    });
  };

  const handleTeamNameVerify = () => {
    if (!teamName.trim()) {
      setError('Please enter your team name');
      return;
    }
    // In the current flow, the token has already validated the voter.
    // This step acts as an extra confirmation gate before showing voting options.
    setStep('vote');
  };

  const handleVoteSubmit = async () => {
    setLoading(true);
    setError('');

    let votePayload: any = isJudge
      ? {
        judgeEmail: judgeEmailFromUrl,
        pollId: pollIdFromUrl,
      }
      : {
        token,
      };

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

      const maxPositions = pollData?.maxRankedPositions;
      if (maxPositions && rankings.length > maxPositions) {
        setError(`Please rank only top ${maxPositions} teams`);
        setLoading(false);
        return;
      }

      const ranks = rankings.map(r => r.rank).sort((a, b) => a - b);
      const uniqueRanks = new Set(ranks);
      if (ranks.length !== uniqueRanks.size) {
        setError('Each team must have a unique rank');
        setLoading(false);
        return;
      }

      if (isJudge) {
        const missingReasons = rankings.filter(r => !r.reason || r.reason.trim() === '');
        if (missingReasons.length > 0) {
          setError('Judges must provide reasons for all rankings');
          setLoading(false);
          return;
        }
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
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated white background with gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-80 h-80 rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, -40, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-72 h-72 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(79, 70, 229, 0.12) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, -40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-[#E2E8F0]/50"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {/* Logo and Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Logo size={48} showText={true} />
              </div>
              <h1 className="text-3xl font-bold text-[#0F172A] mb-2">
                FAIR Voting Portal
              </h1>
              <p className="text-[#64748B]">
                {isJudge ? 'Judge Voting Portal' : 'Cast your anonymous vote'}
              </p>
              {isJudge && (
                <p className="text-sm text-[#DC2626] mt-2">
                  ⚠️ As a judge, you must provide reasons for all rankings
                </p>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert type="error" message={error} />
              </motion.div>
            )}

            {/* Step 1: Token Entry - Only for voters */}
            {step === 'token' && !isJudge && (
              <div className="space-y-4">
                <Input
                  label="Voting Token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your voting token"
                  helperText="Check your email for your unique voting token"
                  required
                />
                <Button
                  onClick={handleTokenSubmit}
                  disabled={loading}
                  isLoading={loading}
                  className="w-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1]"
                  size="lg"
                >
                  {loading ? 'Validating...' : 'Continue'}
                </Button>
              </div>
            )}

            {/* Loading state for judges */}
            {step === 'token' && isJudge && loading && (
              <div className="text-center py-8">
                <LoadingSpinner size="md" message="Validating judge access..." />
              </div>
            )}

            {/* Step 2: Team Name Verification - Only for voters */}
            {step === 'verify' && !isJudge && (
              <div className="space-y-4">
                <p className="text-[#0F172A] mb-4">
                  Please enter your team name to verify your identity:
                </p>
                <Input
                  label="Your Team Name"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter your team name"
                  required
                />
                <Button
                  onClick={handleTeamNameVerify}
                  className="w-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1]"
                  size="lg"
                >
                  Verify
                </Button>
              </div>
            )}

            {/* Step 2: Vote Selection - Single Mode */}
            {step === 'vote' && pollData?.votingMode === 'single' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 rounded-xl p-5 border border-[#4F46E5]/20">
                  <h2 className="text-2xl font-bold text-[#0F172A] mb-2">
                    {pollData?.name}
                  </h2>
                  <p className="text-[#64748B] mb-1">
                    Select the team you want to vote for.
                  </p>
                  {!pollData?.allowSelfVote && !isJudge && voterTeam && (
                    <p className="text-sm text-[#DC2626] font-medium mt-2">
                      ⚠️ You cannot vote for your own team ({voterTeam.teamName})
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <label className="flex items-center cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={showProjectInfo}
                      onChange={(e) => setShowProjectInfo(e.target.checked)}
                      className="mr-2 rounded border-[#E2E8F0] text-[#4F46E5] focus:ring-[#4F46E5] w-4 h-4"
                    />
                    <span className="text-sm font-medium text-[#0F172A]">Show project information</span>
                  </label>
                  <span className="text-xs text-[#64748B] bg-white px-2 py-1 rounded">
                    {availableTeams.length} {availableTeams.length === 1 ? 'team' : 'teams'} available
                  </span>
                </div>

                <div className="space-y-3">
                  {availableTeams.map((team) => (
                    <motion.div
                      key={team.teamId}
                      className={`p-5 border-2 rounded-xl transition-all cursor-pointer ${
                        selectedTeamId === team.teamId
                          ? 'border-[#4F46E5] bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 shadow-lg'
                          : 'border-[#E2E8F0] hover:border-[#4F46E5]/50 hover:bg-[#F8FAFC] hover:shadow-md'
                      }`}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedTeamId(team.teamId)}
                    >
                      <label className="flex items-start cursor-pointer">
                        <input
                          type="radio"
                          name="team"
                          value={team.teamId}
                          checked={selectedTeamId === team.teamId}
                          onChange={(e) => setSelectedTeamId(e.target.value)}
                          className="mt-1 mr-4 text-[#4F46E5] focus:ring-[#4F46E5] w-5 h-5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-lg text-[#0F172A]">{team.teamName}</span>
                            {selectedTeamId === team.teamId && (
                              <span className="text-xs font-bold text-[#4F46E5] bg-[#4F46E5]/10 px-2 py-1 rounded-full">
                                SELECTED
                              </span>
                            )}
                          </div>

                          {showProjectInfo && (team.projectName || team.projectDescription || team.pitch || team.liveSiteUrl || team.githubUrl) && (
                            <div className="mt-2 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                              {team.projectName && (
                                <div className="mb-2">
                                  <span className="text-sm font-semibold text-[#0F172A]">Project: </span>
                                  <span className="text-sm text-[#64748B]">{team.projectName}</span>
                                </div>
                              )}
                              {team.projectDescription && (
                                <div className="mb-2">
                                  <span className="text-sm font-semibold text-[#0F172A]">Description: </span>
                                  <span className="text-sm text-[#64748B]">{team.projectDescription}</span>
                                </div>
                              )}
                              {team.pitch && (
                                <div className="mb-2">
                                  <span className="text-sm font-semibold text-[#0F172A]">Pitch: </span>
                                  <span className="text-sm text-[#64748B]">{team.pitch}</span>
                                </div>
                              )}
                              {team.liveSiteUrl && (
                                <div className="mb-1">
                                  <a href={team.liveSiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#4F46E5] hover:underline">
                                    🔗 Live Site
                                  </a>
                                </div>
                              )}
                              {team.githubUrl && (
                                <div>
                                  <a href={team.githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#4F46E5] hover:underline">
                                    💻 GitHub
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </label>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-4 border-t border-[#E2E8F0]">
                  <Button
                    onClick={handleVoteSubmit}
                    disabled={loading || !canSubmit()}
                    isLoading={loading}
                    className="w-full bg-gradient-to-r from-[#16A34A] to-[#22C55E] hover:from-[#15803D] hover:to-[#16A34A] shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    {loading ? 'Submitting Vote...' : selectedTeamId ? `Submit Vote for ${availableTeams.find(t => t.teamId === selectedTeamId)?.teamName || 'Selected Team'}` : 'Submit Vote'}
                  </Button>
                  {!selectedTeamId && (
                    <p className="text-center text-sm text-[#DC2626] mt-2">Please select a team to vote for</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Vote Selection - Multiple Mode */}
            {step === 'vote' && pollData?.votingMode === 'multiple' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 rounded-xl p-5 border border-[#4F46E5]/20">
                  <h2 className="text-2xl font-bold text-[#0F172A] mb-2">
                    {pollData?.name}
                  </h2>
                  <p className="text-[#64748B] mb-1">
                    Select all teams you want to vote for. You can vote for multiple teams.
                  </p>
                  {!pollData?.allowSelfVote && !isJudge && voterTeam && (
                    <p className="text-sm text-[#DC2626] font-medium mt-2">
                      ⚠️ You cannot vote for your own team ({voterTeam.teamName})
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <label className="flex items-center cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={showProjectInfo}
                      onChange={(e) => setShowProjectInfo(e.target.checked)}
                      className="mr-2 rounded border-[#E2E8F0] text-[#4F46E5] focus:ring-[#4F46E5] w-4 h-4"
                    />
                    <span className="text-sm font-medium text-[#0F172A]">Show project information</span>
                  </label>
                  <span className="text-xs text-[#64748B] bg-white px-2 py-1 rounded">
                    {selectedTeams.length} of {availableTeams.length} selected
                  </span>
                </div>

                <div className="space-y-3">
                  {availableTeams.map((team) => (
                    <motion.div
                      key={team.teamId}
                      className={`p-5 border-2 rounded-xl transition-all cursor-pointer ${
                        selectedTeams.includes(team.teamId)
                          ? 'border-[#4F46E5] bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 shadow-lg'
                          : 'border-[#E2E8F0] hover:border-[#4F46E5]/50 hover:bg-[#F8FAFC] hover:shadow-md'
                      }`}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleMultipleTeamToggle(team.teamId)}
                    >
                      <label className="flex items-start cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTeams.includes(team.teamId)}
                          onChange={() => handleMultipleTeamToggle(team.teamId)}
                          className="mt-1 mr-4 rounded border-[#E2E8F0] text-[#4F46E5] focus:ring-[#4F46E5] w-5 h-5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-lg text-[#0F172A]">{team.teamName}</span>
                            {selectedTeams.includes(team.teamId) && (
                              <span className="text-xs font-bold text-[#4F46E5] bg-[#4F46E5]/10 px-2 py-1 rounded-full">
                                SELECTED
                              </span>
                            )}
                          </div>

                          {showProjectInfo && (team.projectName || team.projectDescription || team.pitch || team.liveSiteUrl || team.githubUrl) && (
                            <div className="mt-2 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                              {team.projectName && (
                                <div className="mb-2">
                                  <span className="text-sm font-semibold text-[#0F172A]">Project: </span>
                                  <span className="text-sm text-[#64748B]">{team.projectName}</span>
                                </div>
                              )}
                              {team.projectDescription && (
                                <div className="mb-2">
                                  <span className="text-sm font-semibold text-[#0F172A]">Description: </span>
                                  <span className="text-sm text-[#64748B]">{team.projectDescription}</span>
                                </div>
                              )}
                              {team.pitch && (
                                <div className="mb-2">
                                  <span className="text-sm font-semibold text-[#0F172A]">Pitch: </span>
                                  <span className="text-sm text-[#64748B]">{team.pitch}</span>
                                </div>
                              )}
                              {team.liveSiteUrl && (
                                <div className="mb-1">
                                  <a href={team.liveSiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#4F46E5] hover:underline">
                                    🔗 Live Site
                                  </a>
                                </div>
                              )}
                              {team.githubUrl && (
                                <div>
                                  <a href={team.githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#4F46E5] hover:underline">
                                    💻 GitHub
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </label>
                    </motion.div>
                  ))}
                </div>

                <Button
                  onClick={handleVoteSubmit}
                  disabled={loading || !canSubmit()}
                  isLoading={loading}
                  className="w-full bg-gradient-to-r from-[#16A34A] to-[#22C55E]"
                  size="lg"
                >
                  {loading ? 'Submitting Vote...' : 'Submit Vote'}
                </Button>
              </div>
            )}

            {/* Step 2: Vote Selection - Ranked Mode */}
            {step === 'vote' && pollData?.votingMode === 'ranked' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 rounded-xl p-5 border border-[#4F46E5]/20">
                  <h2 className="text-2xl font-bold text-[#0F172A] mb-2">
                    {pollData?.name}
                  </h2>
                  <p className="text-[#64748B] mb-1">
                    Rank the teams from best to worst. Assign rank 1 to your top choice, rank 2 to your second choice, and so on.
                    {pollData?.maxRankedPositions && ` (Rank top ${pollData.maxRankedPositions} only)`}
                  </p>
                  {!pollData?.allowSelfVote && !isJudge && voterTeam && (
                    <p className="text-sm text-[#DC2626] font-medium mt-2">
                      ⚠️ You cannot rank your own team ({voterTeam.teamName})
                    </p>
                  )}
                  {isJudge && (
                    <p className="text-sm text-[#DC2626] font-medium mt-2">
                      ⚠️ As a judge, you must provide reasons for all your rankings.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <label className="flex items-center cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={showProjectInfo}
                      onChange={(e) => setShowProjectInfo(e.target.checked)}
                      className="mr-2 rounded border-[#E2E8F0] text-[#4F46E5] focus:ring-[#4F46E5] w-4 h-4"
                    />
                    <span className="text-sm font-medium text-[#0F172A]">Show project information</span>
                  </label>
                  <span className="text-xs text-[#64748B] bg-white px-2 py-1 rounded">
                    {rankings.length} ranked
                  </span>
                </div>

                <div className="space-y-4">
                  {availableTeams.map((team) => {
                    const ranking = rankings.find(r => r.teamId === team.teamId);
                    const maxRank = pollData?.maxRankedPositions || availableTeams.length;
                    return (
                      <div
                        key={team.teamId}
                        className="p-4 border-2 border-[#E2E8F0] rounded-xl hover:border-[#4F46E5]/30 transition-all"
                      >
                        <div className="flex items-center gap-4 mb-2">
                          <div className="w-24">
                            <label className="block text-sm font-medium text-[#0F172A] mb-1">
                              Rank
                            </label>
                            <Input
                              type="number"
                              min="1"
                              max={maxRank}
                              value={ranking?.rank || ''}
                              onChange={(e) => {
                                const rank = parseInt(e.target.value);
                                if (!isNaN(rank) && rank > 0 && rank <= maxRank) {
                                  handleRankChange(team.teamId, rank);
                                } else if (e.target.value === '') {
                                  setRankings(prev => prev.filter(r => r.teamId !== team.teamId));
                                }
                              }}
                              placeholder="Rank"
                              className="text-center"
                            />
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-[#0F172A]">{team.teamName}</span>
                          </div>
                        </div>

                        {showProjectInfo && (team.projectName || team.projectDescription || team.pitch || team.liveSiteUrl || team.githubUrl) && (
                          <div className="mb-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                            {team.projectName && (
                              <div className="mb-2">
                                <span className="text-sm font-semibold text-[#0F172A]">Project: </span>
                                <span className="text-sm text-[#64748B]">{team.projectName}</span>
                              </div>
                            )}
                            {team.projectDescription && (
                              <div className="mb-2">
                                <span className="text-sm font-semibold text-[#0F172A]">Description: </span>
                                <span className="text-sm text-[#64748B]">{team.projectDescription}</span>
                              </div>
                            )}
                            {team.pitch && (
                              <div className="mb-2">
                                <span className="text-sm font-semibold text-[#0F172A]">Pitch: </span>
                                <span className="text-sm text-[#64748B]">{team.pitch}</span>
                              </div>
                            )}
                            {team.liveSiteUrl && (
                              <div className="mb-1">
                                <a href={team.liveSiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#4F46E5] hover:underline">
                                  🔗 Live Site
                                </a>
                              </div>
                            )}
                            {team.githubUrl && (
                              <div>
                                <a href={team.githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#4F46E5] hover:underline">
                                  💻 GitHub
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-[#0F172A] mb-1">
                            Reason {isJudge ? '(Required)' : '(Optional - Voters only)'}
                          </label>
                          <textarea
                            value={ranking?.reason || ''}
                            onChange={(e) => handleReasonChange(team.teamId, e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
                            placeholder={isJudge ? "Explain why you ranked this team here (required)" : "Why did you rank this team here? (optional for voters)"}
                            required={isJudge && !!ranking}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-[#E2E8F0]">
                  <Button
                    onClick={handleVoteSubmit}
                    disabled={loading || !canSubmit()}
                    isLoading={loading}
                    className="w-full bg-gradient-to-r from-[#16A34A] to-[#22C55E] hover:from-[#15803D] hover:to-[#16A34A] shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    {loading ? 'Submitting Vote...' : rankings.length > 0 ? `Submit ${rankings.length} Ranking${rankings.length > 1 ? 's' : ''}` : 'Submit Vote'}
                  </Button>
                  {rankings.length === 0 && (
                    <p className="text-center text-sm text-[#DC2626] mt-2">Please rank at least one team</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 'confirm' && voteResult && (
              <div className="space-y-4">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="text-6xl mb-4"
                  >
                    ✓
                  </motion.div>
                  <h2 className="text-2xl font-bold text-[#16A34A] mb-2">
                    {voteResult.alreadyVoted ? 'Your Vote' : 'Vote Submitted Successfully!'}
                  </h2>
                  <p className="text-[#64748B] mb-6">
                    {voteResult.alreadyVoted
                      ? 'You have already voted. Here is your vote record.'
                      : 'Your vote has been recorded on the blockchain.'}
                  </p>
                </div>

                {pollData && (
                  <div className="bg-[#F8FAFC] rounded-xl p-4 mb-4 text-left border border-[#E2E8F0]">
                    <h3 className="font-semibold text-[#0F172A] mb-3">Vote Details</h3>

                    {voteResult.votingMode === 'single' && voteResult.teamIdTarget && (
                      <div>
                        <p className="text-sm text-[#64748B] mb-1">Selected Team:</p>
                        <p className="text-[#0F172A] font-medium">
                          {availableTeams.find(t => t.teamId === voteResult.teamIdTarget)?.teamName || voteResult.teamIdTarget}
                        </p>
                      </div>
                    )}

                    {voteResult.votingMode === 'multiple' && voteResult.teams && voteResult.teams.length > 0 && (
                      <div>
                        <p className="text-sm text-[#64748B] mb-2">Selected Teams ({voteResult.teams.length}):</p>
                        <ul className="list-disc list-inside space-y-1">
                          {voteResult.teams.map((teamId: string) => (
                            <li key={teamId} className="text-[#0F172A]">
                              {availableTeams.find(t => t.teamId === teamId)?.teamName || teamId}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {voteResult.votingMode === 'ranked' && voteResult.rankings && voteResult.rankings.length > 0 && (
                      <div>
                        <p className="text-sm text-[#64748B] mb-2">Rankings:</p>
                        <div className="space-y-2">
                          {voteResult.rankings
                            .sort((a: any, b: any) => a.rank - b.rank)
                            .map((ranking: any) => (
                              <div key={ranking.teamId} className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#E2E8F0]">
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-full bg-[#4F46E5] text-white flex items-center justify-center text-xs font-bold">
                                    {ranking.rank}
                                  </div>
                                  <span className="text-[#0F172A]">
                                    {availableTeams.find(t => t.teamId === ranking.teamId)?.teamName || ranking.teamId}
                                  </span>
                                  {ranking.reason && (
                                    <span className="text-xs text-[#64748B] ml-2">({ranking.reason})</span>
                                  )}
                                </div>
                                <span className="text-sm font-semibold text-[#4F46E5]">{ranking.points || 0} pts</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {voteResult.timestamp && (
                      <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                        <p className="text-xs text-[#64748B]">
                          Voted on: {new Date(voteResult.timestamp).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {voteResult.txHash && (
                  <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
                    <h3 className="font-semibold text-[#0F172A] mb-2">Blockchain Transaction</h3>
                    <p className="text-sm text-[#64748B] mb-2">
                      Your vote has been recorded on the Avalanche blockchain for transparency.
                    </p>
                    {voteResult.explorerUrl ? (
                      <a
                        href={voteResult.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#4F46E5] hover:underline break-all"
                      >
                        View on Explorer →
                      </a>
                    ) : (
                      <p className="text-sm text-[#64748B] break-all">
                        Transaction Hash: {voteResult.txHash}
                      </p>
                    )}
                  </div>
                )}

                <div className="text-center pt-4">
                  <Link href="/">
                    <Button variant="secondary" className="inline-flex items-center gap-2">
                      <ArrowLeft size={16} />
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Vote page with Suspense boundary
 */
export default function VotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-[#64748B]">Loading...</div>
      </div>
    }>
      <VotePageContent />
    </Suspense>
  );
}
