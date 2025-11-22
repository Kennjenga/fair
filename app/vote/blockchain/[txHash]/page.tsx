'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui';

/**
 * Blockchain vote details page
 */
export default function BlockchainVotePage() {
  const params = useParams();
  const txHash = params?.txHash as string;

  const [voteData, setVoteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (txHash) {
      fetchVoteData();
    }
  }, [txHash]);

  const fetchVoteData = async () => {
    if (!txHash) return;

    try {
      const response = await fetch(`/api/v1/vote/blockchain/${txHash}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load vote data');
        setLoading(false);
        return;
      }

      setVoteData(data);
    } catch (err) {
      setError('An error occurred while loading vote data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading vote data from blockchain..." />
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

  if (!voteData || !voteData.voteData) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-[#dc2626] mb-4">Not Found</h2>
          <p className="text-[#64748b] mb-4">Vote data not found for this transaction.</p>
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

  const { voteData: data } = voteData;

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#1e40af] mb-2">Blockchain Vote Details</h1>
            <p className="text-sm text-[#64748b]">Transaction Hash: {txHash}</p>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="border-b border-[#e2e8f0] pb-4">
              <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Vote Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-[#64748b]">Poll ID:</span>
                  <div className="text-[#0f172a] font-mono text-sm break-all">{data.pollId}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-[#64748b]">Vote Type:</span>
                  <div className="text-[#0f172a] capitalize">{data.voteType || 'voter'}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-[#64748b]">Voting Mode:</span>
                  <div className="text-[#0f172a] capitalize">{data.votingMode || 'single'}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-[#64748b]">Timestamp:</span>
                  <div className="text-[#0f172a]">
                    {data.timestamp ? new Date(data.timestamp * 1000).toLocaleString() : 'N/A'}
                  </div>
                </div>
                {data.judgeEmail && (
                  <div>
                    <span className="text-sm font-medium text-[#64748b]">Judge Email:</span>
                    <div className="text-[#0f172a]">{data.judgeEmail}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Single Vote */}
            {data.votingMode === 'single' && data.teamIdTarget && (
              <div className="border-b border-[#e2e8f0] pb-4">
                <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Vote Details</h2>
                <div>
                  <span className="text-sm font-medium text-[#64748b]">Selected Team:</span>
                  <div className="text-[#0f172a] font-mono text-sm">{data.teamIdTarget}</div>
                </div>
              </div>
            )}

            {/* Multiple Vote */}
            {data.votingMode === 'multiple' && data.teams && data.teams.length > 0 && (
              <div className="border-b border-[#e2e8f0] pb-4">
                <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Vote Details</h2>
                <div>
                  <span className="text-sm font-medium text-[#64748b]">Selected Teams ({data.teams.length}):</span>
                  <div className="mt-2 space-y-1">
                    {data.teams.map((teamId: string, index: number) => (
                      <div key={teamId} className="text-[#0f172a] font-mono text-sm">
                        {index + 1}. {teamId}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Ranked Vote */}
            {data.votingMode === 'ranked' && data.rankings && data.rankings.length > 0 && (
              <div className="border-b border-[#e2e8f0] pb-4">
                <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Rankings</h2>
                <div className="space-y-3">
                  {data.rankings
                    .sort((a: any, b: any) => a.rank - b.rank)
                    .map((ranking: any) => (
                      <div
                        key={ranking.teamId}
                        className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-[#1e40af] text-white flex items-center justify-center font-bold">
                            {ranking.rank}
                          </div>
                          <div>
                            <div className="font-medium text-[#0f172a] font-mono text-sm">
                              Team ID: {ranking.teamId}
                            </div>
                            {ranking.reason && (
                              <div className="text-sm text-[#64748b] mt-1">{ranking.reason}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-[#1e40af]">{ranking.points || 0}</div>
                          <div className="text-xs text-[#64748b]">points</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Verification */}
            <div className="border-b border-[#e2e8f0] pb-4">
              <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Verification</h2>
              <div>
                <span className="text-sm font-medium text-[#64748b]">Vote Hash:</span>
                <div className="text-[#0f172a] font-mono text-xs break-all mt-1 p-2 bg-[#f8fafc] rounded">
                  {data.voteHash}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Metadata</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {data.version && (
                  <div>
                    <span className="font-medium text-[#64748b]">Protocol Version:</span>
                    <div className="text-[#0f172a]">{data.version}</div>
                  </div>
                )}
                {data.protocol && (
                  <div>
                    <span className="font-medium text-[#64748b]">Protocol:</span>
                    <div className="text-[#0f172a]">{data.protocol}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-[#e2e8f0]">
              <a
                href={`https://testnet.snowtrace.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors"
              >
                View on Explorer
              </a>
              <Link
                href="/"
                className="px-4 py-2 bg-[#64748b] text-white rounded-lg hover:bg-[#475569] transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

