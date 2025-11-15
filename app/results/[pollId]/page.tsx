'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Public results page for a poll
 */
export default function ResultsPage() {
  const params = useParams();
  const pollId = params?.pollId as string;
  
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
      // Get auth token if available (for admin access)
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
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-[#64748b]">Loading results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-[#dc2626] mb-4">Error</h2>
          <p className="text-[#64748b] mb-4">{error}</p>
          <Link
            href="/"
            className="text-[#0891b2] hover:text-[#0e7490]"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  // Sort vote counts by count descending
  const sortedVoteCounts = [...(results.results.voteCounts || [])].sort(
    (a, b) => b.vote_count - a.vote_count
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#1e40af] mb-2">
              {results.poll.name}
            </h1>
            <p className="text-[#64748b]">
              Voting Results
            </p>
            <p className="text-sm text-[#94a3b8] mt-2">
              {new Date(results.poll.startTime).toLocaleDateString()} - {new Date(results.poll.endTime).toLocaleDateString()}
            </p>
          </div>

          <div className="mb-8">
            <div className="bg-[#f8fafc] rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-[#1e40af]">{results.results.totalVotes}</div>
                  <div className="text-sm text-[#64748b]">Total Votes</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#059669]">{results.results.teams.length}</div>
                  <div className="text-sm text-[#64748b]">Teams</div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-[#0f172a] mb-4">Vote Counts</h2>
            <div className="space-y-3">
              {sortedVoteCounts.map((item: any, index: number) => (
                <div
                  key={item.team_id}
                  className="flex items-center justify-between p-4 border border-[#e2e8f0] rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-[#059669]' : index === 1 ? 'bg-[#0891b2]' : index === 2 ? 'bg-[#1e40af]' : 'bg-[#64748b]'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-[#0f172a]">{item.team_name}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-[#1e40af]">{item.vote_count}</div>
                </div>
              ))}
            </div>
          </div>

          {results.results.votes && results.results.votes.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-[#0f172a] mb-4">Blockchain Transactions</h2>
              <p className="text-sm text-[#64748b] mb-4">
                All votes are recorded on the Avalanche blockchain. Click any transaction hash to verify on the explorer.
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.results.votes.map((vote: any) => (
                  <div
                    key={vote.voteId}
                    className="p-3 bg-[#f8fafc] rounded border border-[#e2e8f0] text-sm"
                  >
                    {vote.explorerUrl ? (
                      <a
                        href={vote.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0891b2] hover:text-[#0e7490] break-all"
                      >
                        {vote.txHash}
                      </a>
                    ) : (
                      <span className="text-[#64748b]">{vote.txHash || 'Pending'}</span>
                    )}
                    <span className="text-[#94a3b8] ml-2">
                      • {new Date(vote.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-[#0891b2] hover:text-[#0e7490]"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

