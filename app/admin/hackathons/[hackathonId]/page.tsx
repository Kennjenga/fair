'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

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

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin');
    router.push('/admin/login');
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
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-[#e2e8f0]">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin/dashboard" className="text-2xl font-bold text-[#1e40af]">
            FAIR Admin Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[#64748b]">{admin?.email}</span>
            <button
              onClick={handleLogout}
              className="text-[#dc2626] hover:text-[#b91c1c] text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hackathon Info */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin/hackathons"
              className="text-[#1e40af] hover:text-[#1e3a8a]"
            >
              ← Back to Hackathons
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-[#0f172a] mb-2">{hackathon.name}</h1>
          {hackathon.description && (
            <p className="text-[#64748b] mb-2">{hackathon.description}</p>
          )}
          {(hackathon.start_date || hackathon.end_date) && (
            <p className="text-sm text-[#64748b]">
              {hackathon.start_date && new Date(hackathon.start_date).toLocaleDateString()}
              {hackathon.start_date && hackathon.end_date && ' - '}
              {hackathon.end_date && new Date(hackathon.end_date).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Polls Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#0f172a]">Polls</h2>
          <Link
            href={`/admin/hackathons/${hackathonId}/polls/create`}
            className="bg-[#1e40af] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#1e3a8a] transition-colors"
          >
            Create New Poll
          </Link>
        </div>

        {polls.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-[#64748b] mb-4">No polls yet. Create your first poll for this hackathon.</p>
            <Link
              href={`/admin/hackathons/${hackathonId}/polls/create`}
              className="inline-block bg-[#1e40af] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#1e3a8a] transition-colors"
            >
              Create Poll
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {polls.map((poll) => (
              <div key={poll.poll_id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-[#0f172a] mb-2">{poll.name}</h3>
                    <div className="flex gap-4 text-sm text-[#64748b] mb-2">
                      <span>
                        {new Date(poll.start_time).toLocaleDateString()} - {new Date(poll.end_time).toLocaleDateString()}
                      </span>
                      <span>Mode: {poll.voting_mode}</span>
                      <span>Permissions: {poll.voting_permissions}</span>
                    </div>
                  </div>
                  <Link
                    href={`/admin/polls/${poll.poll_id}`}
                    className="bg-[#0891b2] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0e7490] transition-colors"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

