'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button, Card, Badge, Logo, LoadingSpinner } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';

/**
 * Public results page for a poll with modern design
 */
export default function ResultsPage() {
  const params = useParams();
  const pollId = params?.pollId as string;
  const router = useRouter();

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (pollId) {
      fetchResults();
    }
  }, [pollId]);

  const fetchResults = async () => {
    if (!pollId) return;

    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/v1/results/${pollId}`, {
        headers,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load results');
        setLoading(false);
        return;
      }

      setResults(data);
    } catch (err) {
      setError('An error occurred while loading results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading results..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4">
        {/* Background orbs */}
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
        </div>

        <Card className="max-w-md text-center relative z-10">
          <h2 className="text-2xl font-bold text-[#DC2626] mb-4">Error</h2>
          <p className="text-[#64748B] mb-4">{error}</p>
          <Button onClick={() => router.back()} variant="secondary">
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
        </Card>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const sortedTeams = [...(results.results.teams || [])].sort(
    (a, b) => b.totalScore - a.totalScore
  );

  const votingMode = results.poll.votingMode || 'single';

  return (
    <div className="min-h-screen bg-white relative overflow-hidden py-12 px-4">
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
      <div className="container mx-auto max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="backdrop-blur-xl bg-white/90 border-[#E2E8F0]">
            {/* Header with Logo */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Logo size={48} showText={true} />
              </div>
              <h1 className="text-4xl font-bold text-[#4F46E5] mb-2">
                {results.poll.name}
              </h1>
              <p className="text-[#64748B]">
                Voting Results
              </p>
              <p className="text-sm text-[#94A3B8] mt-2">
                {new Date(results.poll.startTime).toLocaleDateString()} - {new Date(results.poll.endTime).toLocaleDateString()}
              </p>
            </div>

            {/* Stats */}
            <div className="mb-8">
              <div className="bg-gradient-to-br from-[#F8FAFC] to-white rounded-xl p-4 mb-4 border border-[#E2E8F0]">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-[#4F46E5]">{results.results.totalVotes}</div>
                    <div className="text-sm text-[#64748B]">Total Votes</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-[#16A34A]">{results.results.teams.length}</div>
                    <div className="text-sm text-[#64748B]">Teams</div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-[#0F172A] mb-4">
                {votingMode === 'ranked' ? 'Rankings' : 'Vote Counts'}
              </h2>
              {sortedTeams.length > 0 ? (
                <div className="space-y-3">
                  {sortedTeams.map((item: any, index: number) => {
                    const voterScore = typeof item.voterScore === 'number' ? item.voterScore : parseFloat(item.voterScore || 0);
                    const judgeScore = typeof item.judgeScore === 'number' ? item.judgeScore : parseFloat(item.judgeScore || 0);
                    const totalScore = typeof item.totalScore === 'number' ? item.totalScore : parseFloat(item.totalScore || 0);
                    const rankedPoints = typeof item.rankedPoints === 'number' ? item.rankedPoints : parseFloat(item.rankedPoints || 0);
                    const voteCount = typeof item.voteCount === 'number' ? item.voteCount : parseInt(item.voteCount || 0, 10);

                    let displayValue: string | number;
                    let displayLabel = '';

                    if (votingMode === 'ranked') {
                      displayValue = parseFloat((rankedPoints || totalScore || 0).toFixed(2));
                      displayLabel = 'points';
                    } else {
                      displayValue = voteCount || 0;
                      displayLabel = displayValue === 1 ? 'vote' : 'votes';
                    }

                    return (
                      <motion.div
                        key={item.teamId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-xl transition-all border-l-4 border-[#4F46E5]/20 hover:border-[#4F46E5]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-gradient-to-br from-[#F59E0B] to-[#FBBF24]' :
                                index === 1 ? 'bg-gradient-to-br from-[#64748B] to-[#94A3B8]' :
                                  index === 2 ? 'bg-gradient-to-br from-[#D97706] to-[#F59E0B]' :
                                    'bg-gradient-to-br from-[#64748B] to-[#94A3B8]'
                                }`}>
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-semibold text-[#0F172A]">{item.teamName}</div>
                                {(results.results.voterVotes > 0 || results.results.judgeVotes > 0) && (voterScore > 0 || judgeScore > 0) && (
                                  <div className="text-xs text-[#64748B] mt-1">
                                    {voterScore > 0 && (
                                      <span>Voters: {voterScore.toFixed(2)}</span>
                                    )}
                                    {voterScore > 0 && judgeScore > 0 && ' • '}
                                    {judgeScore > 0 && (
                                      <span>Judges: {judgeScore.toFixed(2)}</span>
                                    )}
                                  </div>
                                )}

                                {votingMode === 'ranked' && item.positionCounts && Object.keys(item.positionCounts).length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {Object.entries(item.positionCounts)
                                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                      .map(([position, count]: [string, any]) => (
                                        <Badge
                                          key={position}
                                          className="bg-[#4F46E5]/10 text-[#4F46E5] border-[#4F46E5]/20"
                                        >
                                          #{position}: {count}×
                                        </Badge>
                                      ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-[#4F46E5]">{displayValue}</div>
                              <div className="text-xs text-[#64748B]">{displayLabel}</div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-[#64748B]">
                  No votes recorded yet.
                </div>
              )}
            </div>

            {/* Blockchain Transactions */}
            {results.results.votes && results.results.votes.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold text-[#0F172A] mb-4">Blockchain Transactions</h2>
                <p className="text-sm text-[#64748B] mb-4">
                  All votes are recorded on the Avalanche blockchain in a readable format. Click any transaction hash to view details or verify on the explorer.
                </p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {results.results.votes.map((vote: any) => (
                    <div
                      key={vote.voteId}
                      className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-sm hover:border-[#4F46E5]/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {vote.explorerUrl ? (
                            <a
                              href={vote.explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#4F46E5] hover:underline break-all"
                            >
                              {vote.txHash}
                            </a>
                          ) : (
                            <span className="text-[#64748B]">{vote.txHash || 'Pending'}</span>
                          )}
                          <span className="text-[#94A3B8] ml-2">
                            • {new Date(vote.timestamp).toLocaleString()}
                          </span>
                          {vote.voteType && (
                            <span className="text-[#94A3B8] ml-2">
                              • {vote.voteType === 'judge' ? 'Judge' : 'Voter'} vote
                            </span>
                          )}
                        </div>
                        {vote.txHash && (
                          <a
                            href={`/vote/blockchain/${vote.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 text-xs text-[#4F46E5] hover:underline"
                          >
                            View Details
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Back Button */}
            <div className="mt-8 text-center">
              <Button onClick={() => router.back()} variant="secondary" className="inline-flex items-center gap-2">
                <ArrowLeft size={16} />
                Back
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
