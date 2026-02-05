'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { Sidebar } from '@/components/layouts';
import { Shield, ExternalLink, ChevronLeft, Hash, Layers, Calendar, Vote } from 'lucide-react';

/**
 * Commitment record as returned by the integrity API (with explorerUrl).
 */
interface BlockchainRecord {
  commitmentId: string;
  commitmentType: string;
  commitmentHash: string;
  commitmentData: Record<string, unknown>;
  txHash: string | null;
  blockNumber: number | null;
  createdAt: string;
  explorerUrl: string | null;
}

/** Poll summary for linking to poll-level blockchain view (vote transactions). */
interface PollSummary {
  poll_id: string;
  name: string;
}

/**
 * Hackathon Integrity / Blockchain Records page.
 * Shown when the user clicks "Verify" on a decision card; displays all
 * integrity commitments and their blockchain transaction links.
 */
export default function HackathonIntegrityPage() {
  const router = useRouter();
  const params = useParams();
  const hackathonId = params.hackathonId as string;

  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hackathonName, setHackathonName] = useState<string>('');
  const [commitments, setCommitments] = useState<BlockchainRecord[]>([]);
  const [polls, setPolls] = useState<PollSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }

    const parsed = JSON.parse(adminData);
    setAdmin(parsed);

    const authHeaders = { Authorization: `Bearer ${token}` };

    // Fetch hackathon integrity commitments and polls in parallel
    Promise.all([
      fetch(`/api/v1/admin/hackathons/${hackathonId}/integrity`, { headers: authHeaders }),
      fetch(`/api/v1/admin/hackathons/${hackathonId}/polls`, { headers: authHeaders }),
    ])
      .then(async ([integrityRes, pollsRes]) => {
        if (!integrityRes.ok) {
          if (integrityRes.status === 403) setError('Access denied');
          else if (integrityRes.status === 404) setError('Hackathon not found');
          else setError('Failed to load blockchain records');
        } else {
          const data = (await integrityRes.json()) as { hackathonName?: string; commitments?: BlockchainRecord[] };
          setHackathonName(data.hackathonName || 'Hackathon');
          setCommitments(data.commitments || []);
        }
        if (pollsRes.ok) {
          const data = (await pollsRes.json()) as { polls?: PollSummary[] };
          setPolls(data.polls || []);
        }
      })
      .catch(() => setError('Failed to load blockchain records'))
      .finally(() => setLoading(false));
  }, [hackathonId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-[#334155]">Loading blockchain records...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Back link */}
          <Link
            href={`/admin/hackathons/${hackathonId}`}
            className="inline-flex items-center gap-1 text-[#4F46E5] hover:text-[#6366F1] mb-6 font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to hackathon
          </Link>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-10 h-10 text-[#4F46E5]" />
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">Blockchain records</h1>
              <p className="text-[#64748B]">
                {hackathonName} — integrity commitments and on-chain transaction links
              </p>
            </div>
          </div>

          {error && (
            <Card className="p-4 mb-6 border-amber-200 bg-amber-50 text-amber-800">
              {error}
            </Card>
          )}

          {!error && commitments.length === 0 && (
            <Card className="p-8 text-center">
              <Shield className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-[#0F172A] mb-2">No blockchain records yet</h2>
              <p className="text-[#64748B] mb-4">
                Integrity commitments for this hackathon have not been anchored on-chain yet.
              </p>
              <Link href={`/admin/hackathons/${hackathonId}`}>
                <Button variant="secondary">Back to hackathon</Button>
              </Link>
            </Card>
          )}

          {!error && commitments.length > 0 && (
            <div className="space-y-4">
              {commitments.map((record) => (
                <Card key={record.commitmentId} className="p-5 border border-[#E2E8F0]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#4F46E5]" />
                      <span className="font-semibold text-[#0F172A] capitalize">
                        {record.commitmentType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {record.explorerUrl && record.txHash && (
                      <a
                        href={record.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-[#4F46E5] hover:text-[#6366F1]"
                      >
                        View on explorer
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {record.txHash && (
                      <>
                        <div>
                          <dt className="text-[#64748B] flex items-center gap-1">
                            <Hash className="w-3.5 h-3.5" /> Transaction hash
                          </dt>
                          <dd className="font-mono text-[#0F172A] break-all mt-0.5">
                            {record.explorerUrl ? (
                              <a
                                href={record.explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#4F46E5] hover:underline"
                              >
                                {record.txHash}
                              </a>
                            ) : (
                              record.txHash
                            )}
                          </dd>
                        </div>
                        {record.blockNumber != null && (
                          <div>
                            <dt className="text-[#64748B] flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5" /> Block number
                            </dt>
                            <dd className="font-mono text-[#0F172A] mt-0.5">{record.blockNumber}</dd>
                          </div>
                        )}
                      </>
                    )}
                    <div className="sm:col-span-2">
                      <dt className="text-[#64748B] flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" /> Commitment hash
                      </dt>
                      <dd className="font-mono text-[#0F172A] break-all mt-0.5 text-xs">
                        {record.commitmentHash}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#64748B] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Created
                      </dt>
                      <dd className="text-[#0F172A] mt-0.5">
                        {new Date(record.createdAt).toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </Card>
              ))}
            </div>
          )}

          {/* Polls — blockchain view: link to each poll's results page (vote transactions) */}
          {!error && polls.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                <Vote className="w-5 h-5 text-[#4F46E5]" />
                Polls — blockchain view
              </h2>
              <p className="text-sm text-[#64748B] mb-4">
                View results and blockchain transactions (vote hashes) for each poll in this hackathon.
              </p>
              <div className="space-y-3">
                {polls.map((poll) => (
                  <Card key={poll.poll_id} className="p-4 border border-[#E2E8F0] flex items-center justify-between gap-4">
                    <span className="font-medium text-[#0F172A]">{poll.name}</span>
                    <Link href={`/results/${poll.poll_id}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" size="sm" className="gap-1">
                        View results & blockchain
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
