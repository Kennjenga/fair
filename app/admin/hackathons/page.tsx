'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Hackathons list page
 */
export default function HackathonsPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [hackathons, setHackathons] = useState<any[]>([]);
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

    // Fetch hackathons
    fetchHackathons(token);
  }, [router]);

  const fetchHackathons = async (token: string) => {
    try {
      const response = await fetch('/api/v1/admin/hackathons', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin');
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      setHackathons(data.hackathons || []);
    } catch (error) {
      console.error('Failed to fetch hackathons:', error);
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-[#0f172a]">My Hackathons</h2>
          <Link
            href="/admin/hackathons/create"
            className="bg-[#1e40af] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#1e3a8a] transition-colors"
          >
            Create New Hackathon
          </Link>
        </div>

        {hackathons.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-[#64748b] mb-4">No hackathons yet. Create your first hackathon to get started.</p>
            <Link
              href="/admin/hackathons/create"
              className="inline-block bg-[#1e40af] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#1e3a8a] transition-colors"
            >
              Create Hackathon
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {hackathons.map((hackathon) => (
              <div key={hackathon.hackathon_id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-[#0f172a] mb-2">{hackathon.name}</h3>
                    {hackathon.description && (
                      <p className="text-sm text-[#64748b] mb-2">{hackathon.description}</p>
                    )}
                    {(hackathon.start_date || hackathon.end_date) && (
                      <p className="text-sm text-[#64748b]">
                        {hackathon.start_date && new Date(hackathon.start_date).toLocaleDateString()}
                        {hackathon.start_date && hackathon.end_date && ' - '}
                        {hackathon.end_date && new Date(hackathon.end_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/admin/hackathons/${hackathon.hackathon_id}`}
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

