'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Input } from '@/components/ui';
import { Sidebar } from '@/components/layouts';

const sidebarItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { label: 'Hackathons', href: '/admin/hackathons', icon: '🏆' },
  { label: 'Polls', href: '/admin/polls', icon: '🗳️' },
];

/**
 * Create hackathon page (supports template-based creation)
 */
export default function CreateHackathonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');

  const [template, setTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    votingClosesAt: '', // When voting closes, status changes to 'closed'
    submissionDeadline: '',
    evaluationDeadline: '',
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

    // Fetch template if templateId is provided
    if (templateId) {
      fetchTemplate(templateId, token);
    }
  }, [router, templateId]);

  const fetchTemplate = async (id: string, token: string) => {
    try {
      const response = await fetch(`/api/v1/admin/templates/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplate(data.template);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    }
  };

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

      // Validate votingClosesAt if provided
      if (formData.votingClosesAt) {
        const votingClosesAt = new Date(formData.votingClosesAt);
        if (isNaN(votingClosesAt.getTime())) {
          setError('Invalid voting closes at format');
          setLoading(false);
          return;
        }
        if (votingClosesAt < startDate || votingClosesAt > endDate) {
          setError('Voting closes at must be between start date and end date');
          setLoading(false);
          return;
        }
      }
    }

    try {
      // Use template endpoint if templateId is provided
      const endpoint = templateId ? '/api/v1/admin/hackathons/from-template' : '/api/v1/admin/hackathons';
      const requestBody = templateId
        ? {
            templateId,
            name: formData.name,
            description: formData.description || undefined,
            startDate: formData.startDate || undefined,
            endDate: formData.endDate || undefined,
            votingClosesAt: formData.votingClosesAt || undefined,
            submissionDeadline: formData.submissionDeadline || undefined,
            evaluationDeadline: formData.evaluationDeadline || undefined,
          }
        : {
            name: formData.name,
            description: formData.description || undefined,
            startDate: formData.startDate || undefined,
            endDate: formData.endDate || undefined,
            votingClosesAt: formData.votingClosesAt || undefined,
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar items={sidebarItems} user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Create New Hackathon</h1>
          {template && (
            <p className="text-[#64748B] mb-6">
              Using template: <span className="font-semibold">{template.name}</span>
            </p>
          )}
          {!template && templateId && (
            <p className="text-[#64748B] mb-6">Loading template...</p>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Hackathon Name *"
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Hackathon 2025"
              />

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-[#334155] mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
                  placeholder="Optional description of the hackathon"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label="Start Date"
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />

                <Input
                  label="End Date"
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>

              {/* Voting Closes At - determines when hackathon status changes to 'closed' */}
              <Input
                label="Voting Closes At"
                id="votingClosesAt"
                type="datetime-local"
                value={formData.votingClosesAt}
                onChange={(e) => setFormData({ ...formData, votingClosesAt: e.target.value })}
                helperText="When voting closes, the hackathon status will automatically change to 'closed'. When the end date is reached, status changes to 'finalized'."
              />

              {/* Deadlines (only show if using template) */}
              {templateId && (
                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="Submission Deadline"
                    id="submissionDeadline"
                    type="datetime-local"
                    value={formData.submissionDeadline}
                    onChange={(e) => setFormData({ ...formData, submissionDeadline: e.target.value })}
                  />

                  <Input
                    label="Evaluation Deadline"
                    id="evaluationDeadline"
                    type="datetime-local"
                    value={formData.evaluationDeadline}
                    onChange={(e) => setFormData({ ...formData, evaluationDeadline: e.target.value })}
                  />
                </div>
              )}

              {/* Form Fields Preview */}
              {template && template.default_form_fields && template.default_form_fields.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Participation Form Fields</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {template.default_form_fields.map((field: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-xs">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-900">{field.fieldLabel}</span>
                        <span className="text-gray-500">({field.fieldType})</span>
                        {field.isRequired && <span className="text-red-500 text-xs">Required</span>}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    You can customize these fields after creating the hackathon
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  isLoading={loading}
                  className="flex-1"
                >
                  Create Hackathon
                </Button>
                <Link
                  href="/admin/hackathons"
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

