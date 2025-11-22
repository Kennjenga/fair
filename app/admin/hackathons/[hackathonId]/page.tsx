'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layouts';
import { Button, Card } from '@/components/ui';

const sidebarItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { label: 'Hackathons', href: '/admin/hackathons', icon: '🏆' },
  { label: 'Polls', href: '/admin/polls', icon: '🗳️' },
];

/**
 * Hackathon detail page with polls list
 */
export default function HackathonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const hackathonId = params.hackathonId as string;

  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [hackathon, setHackathon] = useState<any>(null);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }

    const parsed = JSON.parse(adminData);
    setAdmin(parsed);

    // Fetch hackathon and polls
    fetchHackathonData(token);
  }, [hackathonId, router]);

  const fetchHackathonData = async (token: string) => {
    try {
      // Fetch hackathon
      const hackathonResponse = await fetch(`/api/v1/admin/hackathons/${hackathonId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (hackathonResponse.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin');
        router.push('/admin/login');
        return;
      }

      if (!hackathonResponse.ok) {
        console.error('Failed to fetch hackathon');
        setLoading(false);
        return;
      }

      const hackathonData = await hackathonResponse.json();
      setHackathon(hackathonData.hackathon);

      // Fetch polls for this hackathon
      const pollsResponse = await fetch(`/api/v1/admin/hackathons/${hackathonId}/polls`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (pollsResponse.ok) {
        const pollsData = await pollsResponse.json();
        setPolls(pollsData.polls || []);
      }
    } catch (error) {
      console.error('Failed to fetch hackathon data:', error);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-[#64748b]">Loading...</div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#64748b] mb-4">Hackathon not found</p>
          <Link
            href="/admin/hackathons"
            className="text-[#1e40af] hover:text-[#1e3a8a]"
          >
            Back to Hackathons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <Sidebar items={sidebarItems} user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Hackathon Info */}
          <div className="mb-8">
            <Link
              href="/admin/hackathons"
              className="inline-flex items-center text-[#4F46E5] hover:text-[#6366F1] mb-4 transition-colors"
            >
              ← Back to Hackathons
            </Link>
            <h1 className="text-4xl font-bold text-[#0F172A] mb-2">{hackathon.name}</h1>
            {hackathon.description && (
              <p className="text-[#64748B] mb-2">{hackathon.description}</p>
            )}
            {(hackathon.start_date || hackathon.end_date) && (
              <p className="text-sm text-[#64748B]">
                {hackathon.start_date && new Date(hackathon.start_date).toLocaleDateString()}
                {hackathon.start_date && hackathon.end_date && ' - '}
                {hackathon.end_date && new Date(hackathon.end_date).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Polls Section */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#0F172A]">Polls</h2>
            <Link href={`/admin/hackathons/${hackathonId}/polls/create`}>
              <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:shadow-lg transition-all">
                Create New Poll
              </Button>
            </Link>
          </div>

          {polls.length === 0 ? (
            <Card className="text-center py-12 bg-gradient-to-br from-white to-[#F8FAFC]">
              <p className="text-[#64748B] mb-4">No polls yet. Create your first poll for this hackathon.</p>
              <Link href={`/admin/hackathons/${hackathonId}/polls/create`}>
                <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1]">Create Poll</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-4">
              {polls.map((poll) => (
                <Card key={poll.poll_id} className="hover:shadow-xl transition-all border-l-4 border-[#4F46E5]/20 hover:border-[#4F46E5]">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-[#0F172A] mb-2">{poll.name}</h3>
                      <div className="flex gap-4 text-sm text-[#64748B] mb-2">
                        <span>
                          {new Date(poll.start_time).toLocaleDateString()} - {new Date(poll.end_time).toLocaleDateString()}
                        </span>
                        <span>Mode: {poll.voting_mode}</span>
                        <span>Permissions: {poll.voting_permissions}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => {
                          router.push(`/admin/polls/${poll.poll_id}?edit=true`);
                        }}
                        className="p-2 text-[#4F46E5] hover:text-[#6366F1] hover:bg-[#4F46E5]/5 rounded-lg transition-colors"
                        title="Edit Poll Details"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <Link href={`/admin/polls/${poll.poll_id}`}>
                        <Button size="sm" className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:shadow-lg transition-all">
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

