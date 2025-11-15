'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Create hackathon page
 */
export default function CreateHackathonPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
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

    // Validate dates if provided
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        setError('Invalid date format');
        setLoading(false);
        return;
      }

      if (endDate <= startDate) {
        setError('End date must be after start date');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/v1/admin/hackathons', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = data.error || 'Failed to create hackathon';
        if (data.details && typeof data.details === 'object') {
          if (data.details.issues && Array.isArray(data.details.issues)) {
            errorMessage = data.details.issues.map((issue: any) => issue.message).join(', ');
          }
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Redirect to hackathon detail page
      router.push(`/admin/hackathons/${data.hackathon.hackathon_id}`);
    } catch (err) {
      console.error('Create hackathon error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin');
    router.push('/admin/login');
  };

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
          <h1 className="text-3xl font-bold text-[#0f172a] mb-6">Create New Hackathon</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#0f172a] mb-1">
                  Hackathon Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                  placeholder="e.g., Hackathon 2025"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-[#0f172a] mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                  placeholder="Optional description of the hackathon"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-[#0f172a] mb-1">
                    Start Date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-[#0f172a] mb-1">
                    End Date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#1e40af] text-white py-2 rounded-lg font-semibold hover:bg-[#1e3a8a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Hackathon'}
                </button>
                <Link
                  href="/admin/hackathons"
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

