'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Create poll page
 */
export default function CreatePollPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    allowSelfVote: false,
    requireTeamNameGate: true,
    isPublicResults: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin');
    router.push('/admin/login');
  };

  // Get default times (now and 7 days from now)
  const now = new Date();
  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16); // 1 hour from now
  const defaultEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16); // 7 days from now

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b border-[#e2e8f0]">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin/dashboard" className="text-2xl font-bold text-[#1e40af]">
            FAIR Admin Dashboard
          </Link>
          <div className="flex items-center gap-4">
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
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-[#0f172a] mb-6">Create New Poll</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#0f172a] mb-1">
                  Poll Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                  placeholder="e.g., Hackathon 2025 Team Voting"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-[#0f172a] mb-1">
                    Start Time *
                  </label>
                  <input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime || defaultStart}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                  />
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-[#0f172a] mb-1">
                    End Time *
                  </label>
                  <input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime || defaultEnd}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="allowSelfVote"
                    type="checkbox"
                    checked={formData.allowSelfVote}
                    onChange={(e) => setFormData({ ...formData, allowSelfVote: e.target.checked })}
                    className="w-4 h-4 text-[#1e40af] border-[#94a3b8] rounded focus:ring-[#1e40af]"
                  />
                  <label htmlFor="allowSelfVote" className="ml-2 text-sm text-[#0f172a]">
                    Allow self-voting (voters can vote for their own team)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="requireTeamNameGate"
                    type="checkbox"
                    checked={formData.requireTeamNameGate}
                    onChange={(e) => setFormData({ ...formData, requireTeamNameGate: e.target.checked })}
                    className="w-4 h-4 text-[#1e40af] border-[#94a3b8] rounded focus:ring-[#1e40af]"
                  />
                  <label htmlFor="requireTeamNameGate" className="ml-2 text-sm text-[#0f172a]">
                    Require team name verification (voters must enter their team name)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="isPublicResults"
                    type="checkbox"
                    checked={formData.isPublicResults}
                    onChange={(e) => setFormData({ ...formData, isPublicResults: e.target.checked })}
                    className="w-4 h-4 text-[#1e40af] border-[#94a3b8] rounded focus:ring-[#1e40af]"
                  />
                  <label htmlFor="isPublicResults" className="ml-2 text-sm text-[#0f172a]">
                    Make results public (anyone can view results without authentication)
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#1e40af] text-white py-2 rounded-lg font-semibold hover:bg-[#1e3a8a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Poll'}
                </button>
                <Link
                  href="/admin/dashboard"
                  className="flex-1 bg-[#64748b] text-white py-2 rounded-lg font-semibold hover:bg-[#475569] transition-colors text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

