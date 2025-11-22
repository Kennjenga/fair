'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Input } from '@/components/ui';
import { Sidebar } from '@/components/layouts';

const sidebarItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { label: 'Hackathons', href: '/admin/hackathons', icon: '🏆' },
  { label: 'Polls', href: '/admin/polls', icon: '🗳️' },
];

/**
 * Create poll page
 */
export default function CreatePollPage() {
  const router = useRouter();

  // Get default times (now and 7 days from now)
  const now = new Date();
  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16); // 1 hour from now
  const defaultEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16); // 7 days from now

  const [formData, setFormData] = useState({
    name: '',
    startTime: defaultStart,
    endTime: defaultEnd,
    allowSelfVote: false,
    requireTeamNameGate: true,
    isPublicResults: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }

    const parsed = JSON.parse(adminData);
    setAdmin(parsed);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    // Validate dates before sending
    if (!formData.startTime || !formData.endTime) {
      setError('Start time and end time are required');
      setLoading(false);
      return;
    }

    const startDate = new Date(formData.startTime);
    const endDate = new Date(formData.endTime);

    // Check if dates are valid
    if (isNaN(startDate.getTime())) {
      setError('Invalid start time. Please select a valid date and time.');
      setLoading(false);
      return;
    }

    if (isNaN(endDate.getTime())) {
      setError('Invalid end time. Please select a valid date and time.');
      setLoading(false);
      return;
    }

    // Check if end time is after start time
    if (endDate <= startDate) {
      setError('End time must be after start time.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/v1/admin/polls', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          allowSelfVote: formData.allowSelfVote,
          requireTeamNameGate: formData.requireTeamNameGate,
          isPublicResults: formData.isPublicResults,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show more specific error messages
        let errorMessage = data.error || 'Failed to create poll';
        if (data.details && typeof data.details === 'object') {
          // Handle Zod validation errors
          if (data.details.issues && Array.isArray(data.details.issues)) {
            errorMessage = data.details.issues.map((issue: any) => issue.message).join(', ');
          }
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Redirect to poll management page
      router.push(`/admin/polls/${data.poll.poll_id}`);
    } catch (err) {
      console.error('Create poll error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar items={sidebarItems} user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-[#0F172A] mb-6">Create New Poll</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Poll Name *"
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Hackathon 2025 Team Voting"
              />

              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label="Start Time *"
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />

                <Input
                  label="End Time *"
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start p-4 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
                  <div className="flex items-center h-5">
                    <input
                      id="allowSelfVote"
                      type="checkbox"
                      checked={formData.allowSelfVote}
                      onChange={(e) => setFormData({ ...formData, allowSelfVote: e.target.checked })}
                      className="w-4 h-4 text-[#4F46E5] border-[#CBD5E1] rounded focus:ring-[#4F46E5]"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="allowSelfVote" className="font-medium text-[#0F172A]">
                      Allow self-voting
                    </label>
                    <p className="text-[#64748B]">Voters can vote for their own team</p>
                  </div>
                </div>

                <div className="flex items-start p-4 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
                  <div className="flex items-center h-5">
                    <input
                      id="requireTeamNameGate"
                      type="checkbox"
                      checked={formData.requireTeamNameGate}
                      onChange={(e) => setFormData({ ...formData, requireTeamNameGate: e.target.checked })}
                      className="w-4 h-4 text-[#4F46E5] border-[#CBD5E1] rounded focus:ring-[#4F46E5]"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="requireTeamNameGate" className="font-medium text-[#0F172A]">
                      Require team name verification
                    </label>
                    <p className="text-[#64748B]">Voters must enter their team name to vote</p>
                  </div>
                </div>

                <div className="flex items-start p-4 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
                  <div className="flex items-center h-5">
                    <input
                      id="isPublicResults"
                      type="checkbox"
                      checked={formData.isPublicResults}
                      onChange={(e) => setFormData({ ...formData, isPublicResults: e.target.checked })}
                      className="w-4 h-4 text-[#4F46E5] border-[#CBD5E1] rounded focus:ring-[#4F46E5]"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="isPublicResults" className="font-medium text-[#0F172A]">
                      Make results public
                    </label>
                    <p className="text-[#64748B]">Anyone can view results without authentication</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  isLoading={loading}
                  className="flex-1"
                >
                  Create Poll
                </Button>
                <Link
                  href="/admin/dashboard"
                  className="flex-1"
                >
                  <Button variant="secondary" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}

