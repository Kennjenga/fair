'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button, Card, Logo, LoadingSpinner } from '@/components/ui';
import { Shield, Vote, ExternalLink, LogOut, Calendar, Award } from 'lucide-react';

/**
 * Voter dashboard — shows participations (hackathons) and vote records with blockchain links.
 */
export default function VoterDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<{
    email: string;
    participations: Array<{
      hackathonId: string;
      hackathonName: string;
      role: string;
      participatedAt: string;
    }>;
    votes: Array<{
      pollId: string;
      pollName: string;
      hackathonId: string | null;
      hackathonName: string;
      teamId: string;
      teamName: string;
      used: boolean;
      votedAt: string | null;
      txHash: string | null;
      explorerUrl: string | null;
    }>;
  } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('voter_token');
    if (!token) {
      router.push('/admin/login?as=voter');
      return;
    }
    fetch('/api/v1/voter/participation', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          router.push('/admin/login?as=voter');
          return null;
        }
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => setError('Failed to load participation'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('voter_token');
    localStorage.removeItem('voter');
    router.push('/admin/login?as=voter');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading your participation..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center">
          <p className="text-[#64748B] mb-4">{error || 'Something went wrong.'}</p>
          <Button onClick={() => router.push('/admin/login?as=voter')} variant="secondary">
            Back to login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#0F172A] font-semibold">
            <Logo size={32} showText={true} />
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#64748B]">{data.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1 text-[#64748B]">
              <LogOut className="w-4 h-4" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Your participation</h1>
          <p className="text-[#64748B]">
            View hackathons you participated in and your vote records on the blockchain.
          </p>
        </motion.div>

        {/* Participated In — hackathons/decisions the voter participated in */}
        <section id="participated-in" className="mb-8">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-1 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#4F46E5]" />
            Participated In
            {data.participations.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-[#EEF2FF] text-[#4F46E5] font-medium">
                {data.participations.length}
              </span>
            )}
          </h2>
          <p className="text-sm text-[#64748B] mb-4">
            Hackathons and decisions you participated in (e.g. as participant or via submission).
          </p>
          {data.participations.length === 0 ? (
            <Card className="p-6 text-center text-[#64748B]">
              No participation recorded yet. Participate in a hackathon (e.g. submit a form) to see it here.
            </Card>
          ) : (
            <div className="space-y-3">
              {data.participations.map((p) => (
                <Card key={p.hackathonId} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#0F172A]">{p.hackathonName}</div>
                    <div className="text-sm text-[#64748B] mt-0.5">
                      Role: {p.role} · {new Date(p.participatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Votes (polls) with blockchain links */}
        <section>
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
            <Vote className="w-5 h-5 text-[#4F46E5]" />
            Your votes & blockchain records
          </h2>
          {data.votes.length === 0 ? (
            <Card className="p-6 text-center text-[#64748B]">
              No voting activity yet. When you vote in a poll (using your voting token), your vote is recorded on the blockchain and will appear here.
            </Card>
          ) : (
            <div className="space-y-4">
              {data.votes.map((v) => (
                <Card key={`${v.pollId}-${v.teamId}`} className="p-4 border border-[#E2E8F0]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-[#0F172A]">{v.pollName}</div>
                      <div className="text-sm text-[#64748B] mt-0.5">
                        {v.hackathonName} · Team: {v.teamName}
                      </div>
                      <div className="text-xs text-[#64748B] mt-1 flex items-center gap-2">
                        <span className={v.used ? 'text-[#059669]' : 'text-[#F59E0B]'}>
                          {v.used ? 'Voted' : 'Not voted yet'}
                        </span>
                        {v.votedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(v.votedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {v.txHash && v.explorerUrl && (
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[#059669]" title="Recorded on blockchain" />
                        <a
                          href={v.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-[#4F46E5] hover:text-[#4338CA]"
                        >
                          View on blockchain
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>
                  {v.txHash && (
                    <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                      <div className="text-xs text-[#64748B] font-mono break-all">
                        Transaction: {v.txHash}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
