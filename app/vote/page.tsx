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
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [pollData, setPollData] = useState<any>(null);
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [voterTeam, setVoterTeam] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [voteResult, setVoteResult] = useState<any>(null);

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

      setPollData(data.poll);
      setAvailableTeams(data.availableTeams);
      setVoterTeam(data.voterTeam);

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

  const handleVoteSubmit = async () => {
    if (!selectedTeamId) {
      setError('Please select a team to vote for');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/vote/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          teamName: voterTeam?.teamName,
          teamIdTarget: selectedTeamId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit vote');
        setLoading(false);
        return;
      }

      setVoteResult(data);
      setStep('confirm');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
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

          {/* Step 3: Vote Selection */}
          {step === 'vote' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-[#0f172a] mb-2">
                  {pollData?.name}
                </h2>
                <p className="text-[#64748b] mb-4">
                  Select the team you want to vote for. You cannot vote for your own team.
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
                disabled={loading || !selectedTeamId}
                className="w-full bg-[#059669] text-white py-2 rounded-lg font-semibold hover:bg-[#047857] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting Vote...' : 'Submit Vote'}
              </button>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 'confirm' && voteResult && (
            <div className="space-y-4 text-center">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-[#059669] mb-2">
                Vote Submitted Successfully!
              </h2>
              <p className="text-[#64748b] mb-6">
                Your vote has been recorded on the blockchain.
              </p>

              {voteResult.txHash && (
                <div className="bg-[#f8fafc] rounded-lg p-4 mb-4">
                  <p className="text-sm text-[#64748b] mb-2">Transaction Hash:</p>
                  <code className="text-xs text-[#0f172a] break-all">{voteResult.txHash}</code>
                  {voteResult.explorerUrl && (
                    <a
                      href={voteResult.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2 text-[#0891b2] hover:text-[#0e7490] text-sm"
                    >
                      View on Avalanche Explorer →
                    </a>
                  )}
                </div>
              )}

              <Link
                href="/"
                className="inline-block bg-[#1e40af] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#1e3a8a] transition-colors"
              >
                Return to Home
              </Link>
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

