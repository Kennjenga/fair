'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layouts';
import { Button, Card, Badge } from '@/components/ui';
import { Copy, ExternalLink, Users, FileText, Search, ChevronLeft, ChevronRight, Edit2, Trash2, X, Check, Upload, FileSpreadsheet, ChevronDown, ChevronUp, Download } from 'lucide-react';

/**
 * Shape of a single form field as returned by the admin form API.
 * Using an explicit interface here keeps the hackathon detail page
 * type-safe without requiring consumers to know about database details.
 */
interface AdminFormField {
  field_id: string;
  field_name: string;
  field_type: string;
  field_label: string;
  field_description: string | null;
  is_required: boolean;
  visibility_scope: string;
  form_key?: string; // Form key (team_formation, project_details, default)
}

const sidebarItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { label: 'Hackathons', href: '/admin/hackathons', icon: '🏆' },
  { label: 'Polls', href: '/admin/polls', icon: '🗳️' },
];

export default function HackathonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const hackathonId = params.hackathonId as string;

  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [hackathon, setHackathon] = useState<any>(null);
  // All configured participation / submission fields for this hackathon, grouped by form_key.
  const [formFields, setFormFields] = useState<AdminFormField[]>([]);
  // Track which forms exist (team_formation, project_details, etc.)
  const [formKeys, setFormKeys] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionsPagination, setSubmissionsPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [submissionsSearch, setSubmissionsSearch] = useState('');
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'form' | 'teams' | 'submissions' | 'polls'>('overview');
  
  // Polls state
  const [polls, setPolls] = useState<any[]>([]);
  const [pollsLoading, setPollsLoading] = useState(false);
  const [pollsSearch, setPollsSearch] = useState('');
  const [pollsFilter, setPollsFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('all');
  
  // Team CSV upload state
  const [uploadingTeams, setUploadingTeams] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  
  // Form field expansion state (track which forms have expanded fields)
  const [expandedForms, setExpandedForms] = useState<Set<string>>(new Set());

  /**
   * Local state for template-based form creation.
   * Users can only create forms from predefined templates (Team Formation, Project Details).
   */
  const [creatingField, setCreatingField] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<Partial<AdminFormField> | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedFormKey, setSelectedFormKey] = useState<string>('team_formation');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }

    const parsed = JSON.parse(adminData);
    setAdmin(parsed);

    fetchHackathonData(token);
  }, [hackathonId, router]);

  /**
   * Fetch submissions with pagination and search
   */
  const fetchSubmissions = async (token: string, page: number, search: string) => {
    try {
      setSubmissionsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '10',
      });
      if (search.trim()) {
        params.append('search', search.trim());
      }

      const submissionsRes = await fetch(
        `/api/v1/admin/hackathons/${hackathonId}/submissions?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (submissionsRes.ok) {
        const data = await submissionsRes.json();
        setSubmissions(data.submissions || []);
        setSubmissionsPagination(data.pagination || submissionsPagination);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const fetchHackathonData = async (token: string) => {
    try {
      // Fetch hackathon details
      const hackathonRes = await fetch(`/api/v1/admin/hackathons/${hackathonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (hackathonRes.ok) {
        const data = await hackathonRes.json();
        setHackathon(data.hackathon);
        
        // Automatically update status based on dates (if needed)
        // This ensures status is current when viewing the hackathon
        if (data.hackathon) {
          try {
            // Call auto-update endpoint (or trigger it server-side)
            // For now, we'll just ensure the status is correct on the client
            const now = new Date();
            const votingClosesAt = data.hackathon.voting_closes_at ? new Date(data.hackathon.voting_closes_at) : null;
            const endDate = data.hackathon.end_date ? new Date(data.hackathon.end_date) : null;
            
            // Check if status needs updating (client-side check for UI feedback)
            if (endDate && now >= endDate && data.hackathon.status !== 'finalized') {
              // Status should be finalized - will be handled server-side on next status update
            } else if (votingClosesAt && now >= votingClosesAt && data.hackathon.status === 'live') {
              // Status should be closed - will be handled server-side on next status update
            }
          } catch (err) {
            // Ignore auto-update errors on client
            console.warn('Could not check status auto-update:', err);
          }
        }
      }

      // Fetch form fields
      const formRes = await fetch(`/api/v1/admin/hackathons/${hackathonId}/form`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (formRes.ok) {
        const data = await formRes.json();
        const fields = (data.fields || []) as AdminFormField[];
        setFormFields(fields);
        // Extract unique form_keys to show form grouping
        const uniqueFormKeys = Array.from(new Set(fields.map((f: AdminFormField) => f.form_key || 'default')));
        setFormKeys(uniqueFormKeys.sort());
      }

      // Fetch submissions (initial load - first page)
      await fetchSubmissions(token, 1, '');
      
      // Fetch polls for this hackathon
      await fetchPolls(token);
    } catch (error) {
      console.error('Failed to fetch hackathon data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Fetch polls for the hackathon
   */
  const fetchPolls = async (token: string) => {
    try {
      setPollsLoading(true);
      const pollsRes = await fetch(`/api/v1/admin/hackathons/${hackathonId}/polls`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (pollsRes.ok) {
        const data = await pollsRes.json();
        setPolls(data.polls || []);
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setPollsLoading(false);
    }
  };
  
  /**
   * Get poll status based on current time
   */
  const getPollStatus = (poll: any) => {
    const now = new Date();
    const startTime = new Date(poll.start_time);
    const endTime = new Date(poll.end_time);
    
    if (startTime <= now && endTime >= now) return 'active';
    if (endTime < now) return 'ended';
    return 'upcoming';
  };
  
  /**
   * Filter polls based on search and status filter
   */
  const filteredPolls = polls.filter((poll) => {
    // Filter by status
    if (pollsFilter !== 'all') {
      const status = getPollStatus(poll);
      if (status !== pollsFilter) return false;
    }
    
    // Filter by search query
    if (pollsSearch) {
      const query = pollsSearch.toLowerCase();
      return poll.name.toLowerCase().includes(query);
    }
    
    return true;
  });

  /**
   * Update hackathon status with date validation.
   * Prevents status changes when dates have passed (e.g., can't change to 'live'
   * if voting_closes_at has passed, can't change from 'finalized', etc.)
   */
  const updateStatus = async (newStatus: string) => {
    try {
      setStatusError('');
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/v1/admin/hackathons/${hackathonId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setHackathon(data.hackathon);
        setStatusError('');
        // Refresh hackathon data to get updated status
        if (token) {
          await fetchHackathonData(token);
        }
      } else {
        const error = await response.json();
        // Show validation error from server (e.g., "Cannot change to 'live' because voting closed at...")
        setStatusError(error.error || error.details || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setStatusError('Failed to update status. Please try again.');
    }
  };

  /**
   * Start editing a form field
   */
  const handleStartEdit = (field: AdminFormField) => {
    setEditingFieldId(field.field_id);
    setEditingField({
      field_label: field.field_label,
      field_description: field.field_description,
      is_required: field.is_required,
    });
  };

  /**
   * Cancel editing
   */
  const handleCancelEdit = () => {
    setEditingFieldId(null);
    setEditingField(null);
  };

  /**
   * Save edited field
   */
  const handleSaveEdit = async (fieldId: string) => {
    if (!editingField) return;

    try {
      setFormError('');
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch(
        `/api/v1/admin/hackathons/${hackathonId}/form`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fieldId,
            fieldLabel: editingField.field_label,
            fieldDescription: editingField.field_description,
            isRequired: editingField.is_required,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        // Update the field in the list
        setFormFields((previous) =>
          previous.map((f) =>
            f.field_id === fieldId ? (data.field as AdminFormField) : f
          )
        );
        setEditingFieldId(null);
        setEditingField(null);
      } else {
        const error = await response.json();
        setFormError(error.error || 'Failed to update field');
      }
    } catch (error) {
      console.error('Error updating field:', error);
      setFormError('Failed to update field. Please try again.');
    }
  };

  /**
   * Delete a form field
   */
  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field? This action cannot be undone.')) {
        return;
      }

    try {
      setFormError('');
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch(
        `/api/v1/admin/hackathons/${hackathonId}/form?fieldId=${fieldId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        // Remove the field from the list
        setFormFields((previous) => previous.filter((f) => f.field_id !== fieldId));
        // Refresh form keys if needed
        const remainingFields = formFields.filter((f) => f.field_id !== fieldId);
        const remainingFormKeys = Array.from(
          new Set(remainingFields.map((f) => f.form_key || 'default'))
        );
        setFormKeys(remainingFormKeys.sort());
      } else {
        const error = await response.json();
        setFormError(error.error || 'Failed to delete field');
      }
    } catch (error) {
      console.error('Error deleting field:', error);
      setFormError('Failed to delete field. Please try again.');
    }
  };

  /**
   * Copy submission link for a form
   */
  const copyFormSubmissionLink = async (formKey: string) => {
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/hackathons/${hackathonId}/submit${formKey !== 'default' ? `?form=${formKey}` : ''}`;
    try {
      await navigator.clipboard.writeText(link);
      alert('Submission link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link. Please copy manually: ' + link);
    }
  };

  /**
   * Toggle form field expansion
   */
  const toggleFormExpansion = (formKey: string) => {
    setExpandedForms((prev) => {
      const next = new Set(prev);
      if (next.has(formKey)) {
        next.delete(formKey);
      } else {
        next.add(formKey);
      }
      return next;
    });
  };

  /**
   * Delete entire form (all fields for a form_key)
   */
  const handleDeleteForm = async (formKey: string) => {
    const formLabel =
      formKey === 'team_formation'
        ? 'Team Formation Form'
        : formKey === 'project_details'
          ? 'Project Details Form'
          : 'Default Form';

    if (!confirm(`Are you sure you want to delete the entire "${formLabel}"? This will remove all ${formFields.filter((f) => (f.form_key || 'default') === formKey).length} field(s) and cannot be undone.`)) {
      return;
    }

    try {
      setFormError('');
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch(
        `/api/v1/admin/hackathons/${hackathonId}/form?formKey=${formKey}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        // Remove all fields for this form from the list
        setFormFields((previous) => previous.filter((f) => (f.form_key || 'default') !== formKey));
        // Update form keys
        const remainingFields = formFields.filter((f) => (f.form_key || 'default') !== formKey);
        const remainingFormKeys = Array.from(
          new Set(remainingFields.map((f) => f.form_key || 'default'))
        );
        setFormKeys(remainingFormKeys.sort());
        // Remove from expanded forms
        setExpandedForms((prev) => {
          const next = new Set(prev);
          next.delete(formKey);
          return next;
        });
      } else {
        const error = await response.json();
        setFormError(error.error || 'Failed to delete form');
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      setFormError('Failed to delete form. Please try again.');
    }
  };

  /**
   * Download CSV template
   */
  const downloadCsvTemplate = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setUploadError('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(
        `/api/v1/admin/hackathons/${hackathonId}/teams/csv-template`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `team-import-template-${hackathonId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        setUploadError(error.error || 'Failed to download template');
      }
    } catch (error: any) {
      console.error('Error downloading CSV template:', error);
      setUploadError('Failed to download template. Please try again.');
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading hackathon...</p>
        </div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Hackathon not found</p>
          <Link href="/admin/hackathons" className="text-blue-600 hover:text-blue-700">
            Back to Hackathons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar items={sidebarItems} user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin/hackathons"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              ← Back to Hackathons
            </Link>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{hackathon.name}</h1>
                {hackathon.description && (
                  <p className="text-gray-600 mb-4">{hackathon.description}</p>
                )}
                <div className="flex items-center gap-3">
                  {/* Map hackathon status to a valid Badge variant for consistent styling */}
                  <Badge variant={
                    hackathon.status === 'live' ? 'success' :
                    hackathon.status === 'draft' ? 'warning' :
                    hackathon.status === 'closed' ? 'secondary' : 'secondary'
                  }>
                    {hackathon.status}
                  </Badge>
                  {hackathon.template_name && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                      {hackathon.template_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('form')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'form'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Forms ({formKeys.length})
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'teams'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Teams
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'submissions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Submissions ({submissions.length})
              </button>
              <button
                onClick={() => setActiveTab('polls')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'polls'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                🗳️ Polls ({polls.length})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Status Management + Poll entry point */}
              <Card>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Management</h3>
                    
                    {/* Show validation error if status change was rejected */}
                    {statusError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        {statusError}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateStatus('draft')}
                    disabled={hackathon.status === 'draft'}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Draft
                  </button>
                  <button
                    onClick={() => updateStatus('live')}
                    disabled={hackathon.status === 'live'}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Live
                  </button>
                  <button
                    onClick={() => updateStatus('closed')}
                    disabled={hackathon.status === 'closed'}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Closed
                  </button>
                  <button
                    onClick={() => updateStatus('finalized')}
                    disabled={hackathon.status === 'finalized'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Finalized
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  Current status: <strong>{hackathon.status}</strong>
                </p>
                    {hackathon.voting_closes_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Voting closes: <strong>{new Date(hackathon.voting_closes_at).toLocaleString()}</strong>
                        {new Date() >= new Date(hackathon.voting_closes_at) && hackathon.status === 'live' && (
                          <span className="ml-2 text-orange-600">(Status should be 'closed')</span>
                        )}
                      </p>
                    )}
                    {hackathon.end_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        End date: <strong>{new Date(hackathon.end_date).toLocaleString()}</strong>
                        {new Date() >= new Date(hackathon.end_date) && hackathon.status !== 'finalized' && (
                          <span className="ml-2 text-red-600">(Status should be 'finalized')</span>
                        )}
                      </p>
                    )}
                    {/* Button to trigger automatic status update */}
                    {(hackathon.voting_closes_at || hackathon.end_date) && (
                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('auth_token');
                            if (!token) return;
                            
                            const response = await fetch(
                              `/api/v1/admin/hackathons/${hackathonId}/auto-update-status`,
                              {
                                method: 'POST',
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                },
                              }
                            );
                            
                            if (response.ok) {
                              const data = await response.json();
                              if (data.hackathon) {
                                setHackathon(data.hackathon);
                                setStatusError('');
                              }
                            }
                          } catch (error) {
                            console.error('Error auto-updating status:', error);
                          }
                        }}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 underline"
                      >
                        Update Status Based on Dates
                      </button>
                    )}
                  </div>

                  {/* Poll creation entry point so admins can create polls for this hackathon */}
                  <Link href={`/admin/hackathons/${hackathonId}/polls/create`}>
                    <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white">
                      Create Poll for this Hackathon
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Hackathon Details */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hackathon Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {hackathon.start_date && (
                    <div>
                      <span className="text-gray-600">Start Date:</span>
                      <p className="font-medium">{new Date(hackathon.start_date).toLocaleString()}</p>
                    </div>
                  )}
                  {hackathon.end_date && (
                    <div>
                      <span className="text-gray-600">End Date:</span>
                      <p className="font-medium">{new Date(hackathon.end_date).toLocaleString()}</p>
                    </div>
                  )}
                  {hackathon.submission_deadline && (
                    <div>
                      <span className="text-gray-600">Submission Deadline:</span>
                      <p className="font-medium">{new Date(hackathon.submission_deadline).toLocaleString()}</p>
                    </div>
                  )}
                  {hackathon.evaluation_deadline && (
                    <div>
                      <span className="text-gray-600">Evaluation Deadline:</span>
                      <p className="font-medium">{new Date(hackathon.evaluation_deadline).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </Card>

            </div>
          )}

          {activeTab === 'form' && (
              <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Participation Form Fields</h3>
                {/* Use Form Template Button */}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                >
                  Use Form Template
                </Button>
              </div>

              {/* Template Selector - Improved UI */}
              {showTemplateSelector && (
                <div className="mb-6 p-6 rounded-lg border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Create Form from Template</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Select a template to quickly create a form with pre-configured fields
                      </p>
                    </div>
                    <button
                      onClick={() => setShowTemplateSelector(false)}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                      title="Close template selector"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {formError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{formError}</p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {/* Team Formation Template Card */}
                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedFormKey === 'team_formation'
                          ? 'border-blue-500 bg-blue-100 shadow-md'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                      }`}
                      onClick={() => setSelectedFormKey('team_formation')}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-semibold text-gray-900">Team Formation Form</h5>
                        {selectedFormKey === 'team_formation' && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-3">
                        Collect team name, description, and detailed member information
                      </p>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Fields:</span> Team Name, Team Description, Team Members
                      </div>
                    </div>

                    {/* Project Details Template Card */}
                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedFormKey === 'project_details'
                          ? 'border-blue-500 bg-blue-100 shadow-md'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                      }`}
                      onClick={() => setSelectedFormKey('project_details')}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-semibold text-gray-900">Project Details Form</h5>
                        {selectedFormKey === 'project_details' && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-3">
                        Collect project submissions with problem statement, solution, and links
                      </p>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Fields:</span> Poll (optional), Team Name, Project Name, Problem Statement, Solution, GitHub Link, Live Link
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTemplateSelector(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={creatingField || formKeys.includes(selectedFormKey)}
                      onClick={async () => {
                        // Check if form already exists
                        if (formKeys.includes(selectedFormKey)) {
                          setFormError(`${selectedFormKey === 'team_formation' ? 'Team Formation' : 'Project Details'} form already exists. You can edit existing fields.`);
                          return;
                        }

                        // Define templates based on selected form key
                        const templates: Record<string, Array<{
                          fieldName: string;
                          fieldLabel: string;
                          fieldType: string;
                          isRequired: boolean;
                          fieldDescription: string;
                        }>> = {
                          team_formation: [
                            { fieldName: 'team_name', fieldLabel: 'Team Name', fieldType: 'text', isRequired: true, fieldDescription: 'Enter your team name' },
                            { fieldName: 'team_description', fieldLabel: 'Team Description', fieldType: 'long_text', isRequired: true, fieldDescription: 'Brief description of your team' },
                            {
                              fieldName: 'team_members',
                              fieldLabel: 'Team Members',
                              fieldType: 'team_members',
                              isRequired: true,
                              fieldDescription: 'Add each team member with email, first name, last name, phone number (include country code), role, and mark one as Team Lead',
                            },
                          ],
                          project_details: [
                            { fieldName: 'poll_id', fieldLabel: 'Poll (Optional)', fieldType: 'select', isRequired: false, fieldDescription: 'Select a poll this project is for, or leave empty for general hackathon submission' },
                            { fieldName: 'team_name', fieldLabel: 'Submitting Team', fieldType: 'text', isRequired: true, fieldDescription: 'Name of the team submitting this project' },
                            { fieldName: 'project_name', fieldLabel: 'Project Name', fieldType: 'text', isRequired: true, fieldDescription: 'Name of your project' },
                            { fieldName: 'problem_statement', fieldLabel: 'Problem Statement', fieldType: 'long_text', isRequired: true, fieldDescription: 'Describe the problem your project solves' },
                            { fieldName: 'solution', fieldLabel: 'Proposed Solution', fieldType: 'long_text', isRequired: true, fieldDescription: 'Explain your solution approach' },
                            { fieldName: 'github_link', fieldLabel: 'GitHub Repository Link', fieldType: 'url', isRequired: false, fieldDescription: 'Link to your project repository (optional)' },
                            { fieldName: 'live_link', fieldLabel: 'Live Demo Link', fieldType: 'url', isRequired: false, fieldDescription: 'Link to live demo or deployed project (optional)' },
                          ],
                        };

                        const templateFields = templates[selectedFormKey] || [];

                        if (templateFields.length === 0) {
                          setFormError('No template available for this form type.');
                          return;
                        }

                        try {
                          setFormError('');
                          setCreatingField(true);
                          const token = localStorage.getItem('auth_token');
                          if (!token) {
                            router.push('/admin/login');
                            return;
                          }

                          const createdFields: AdminFormField[] = [];

                          for (const preset of templateFields) {
                            const response = await fetch(
                              `/api/v1/admin/hackathons/${hackathonId}/form`,
                              {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                  hackathonId,
                                  formKey: selectedFormKey,
                                  fieldName: preset.fieldName,
                                  fieldType: preset.fieldType,
                                  fieldLabel: preset.fieldLabel,
                                  isRequired: preset.isRequired,
                                  fieldDescription: preset.fieldDescription,
                                  displayOrder: createdFields.length,
                                }),
                              },
                            );

                            const data = await response.json();
                            if (!response.ok) {
                              console.error('Failed to create field', preset.fieldName, data);
                              continue;
                            }

                            createdFields.push(data.field as AdminFormField);
                          }

                          if (createdFields.length > 0) {
                            setFormFields((previous) => [...previous, ...createdFields]);
                            // Update formKeys if new form was created
                            const newFormKeys = Array.from(new Set([...formKeys, selectedFormKey]));
                            setFormKeys(newFormKeys.sort());
                            setShowTemplateSelector(false);
                            setFormError('');
                          } else {
                            setFormError('Failed to create form. Please try again.');
                          }
                        } catch (error) {
                          console.error('Error creating form template:', error);
                          setFormError(`Failed to create ${selectedFormKey === 'team_formation' ? 'Team Formation' : 'Project Details'} form. Please try again.`);
                        } finally {
                          setCreatingField(false);
                        }
                      }}
                    >
                      {creatingField ? 'Creating...' : 'Create Form'}
                    </Button>
                  </div>
                </div>
              )}

              {formFields.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-600 mb-2">No forms created yet.</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Click "Use Form Template" above to create a Team Formation or Project Details form.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Group fields by form_key */}
                  {formKeys.map((formKey) => {
                    const fieldsForForm = formFields.filter(
                      (f) => (f.form_key || 'default') === formKey
                    );
                    const formLabel =
                      formKey === 'team_formation'
                        ? 'Team Formation Form'
                        : formKey === 'project_details'
                          ? 'Project Details Form'
                          : 'Default Form';
                    // Generate submission link for this form (all forms get their own link)
                    const submissionLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/hackathons/${hackathonId}/submit${formKey !== 'default' ? `?form=${formKey}` : ''}`;

                    const isExpanded = expandedForms.has(formKey);

                    return (
                      <div key={formKey} className="space-y-3 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 flex-1">
                            <button
                              onClick={() => toggleFormExpansion(formKey)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title={isExpanded ? 'Collapse fields' : 'Expand fields'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                            <h4 className="text-md font-semibold text-gray-900">{formLabel}</h4>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {fieldsForForm.length} field{fieldsForForm.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {/* Submission Link and Actions for this form */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={submissionLink}
                    readOnly
                              className="px-3 py-1.5 text-xs border border-gray-300 rounded bg-gray-50 w-64"
                  />
                  <button
                              onClick={() => copyFormSubmissionLink(formKey)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs flex items-center gap-1"
                              title="Copy submission link"
                            >
                              <Copy className="w-3 h-3" />
                              Copy
                            </button>
                            <a
                              href={submissionLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs flex items-center gap-1"
                              title="Open form in new tab"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Open
                            </a>
                            <button
                              onClick={() => handleDeleteForm(formKey)}
                              className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs flex items-center gap-1"
                              title="Delete entire form"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete Form
                  </button>
                </div>
            </div>
                        
                        {/* Form Fields - Only visible when expanded */}
                        {isExpanded && (
                          <div className="space-y-2 mt-4">
                        {fieldsForForm.map((field, index) => (
                          <div key={field.field_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            {editingFieldId === field.field_id ? (
                              // Edit mode
                              <div className="flex-1 grid md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Field Label
                                  </label>
                                  <input
                                    type="text"
                                    value={editingField?.field_label || ''}
                                    onChange={(e) =>
                                      setEditingField({
                                        ...editingField,
                                        field_label: e.target.value,
                                      })
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Description
                                  </label>
                                  <input
                                    type="text"
                                    value={editingField?.field_description || ''}
                                    onChange={(e) =>
                                      setEditingField({
                                        ...editingField,
                                        field_description: e.target.value,
                                      })
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                                <div className="flex items-end gap-2">
                                  <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700">
                                    <input
                                      type="checkbox"
                                      checked={editingField?.is_required || false}
                                      onChange={(e) =>
                                        setEditingField({
                                          ...editingField,
                                          is_required: e.target.checked,
                                        })
                                      }
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                                    />
                                    Required
                                  </label>
                                  <button
                                    onClick={() => handleSaveEdit(field.field_id)}
                                    className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                                    title="Save changes"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs"
                                    title="Cancel editing"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View mode
                              <>
                      <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-sm">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{field.field_label}</p>
                        <p className="text-sm text-gray-500">
                                    Type: {field.field_type}{' '}
                                    {field.is_required && <span className="text-red-500">*</span>}
                                    {field.field_description && (
                                      <span className="text-gray-400"> • {field.field_description}</span>
                                    )}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                        {field.visibility_scope}
                      </span>
                                <button
                                  onClick={() => handleStartEdit(field)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit field"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteField(field.field_id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete field"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                    </div>
                  ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {activeTab === 'teams' && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Teams</h3>
                <Link href={`/admin/hackathons/${hackathonId}/teams`}>
                  <Button variant="secondary" size="sm">
                    View All Teams
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                View and manage teams extracted from team formation submissions. Teams include member details and associated project information.
              </p>

              {/* CSV/Google Sheet Upload Section */}
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <h4 className="text-md font-semibold text-gray-900 mb-2">Import Teams</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a CSV file or connect to a Google Sheet to import team details and member information.
                </p>

                {/* Upload Success/Error Messages */}
                {uploadSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">{uploadSuccess}</p>
                  </div>
                )}
                {uploadError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{uploadError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CSV Upload */}
                  <div className="border border-gray-300 rounded-lg p-4 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Upload className="w-5 h-5 text-gray-600" />
                      <h5 className="font-medium text-gray-900">Upload CSV File</h5>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      Upload a CSV file with team names and member details.
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      id="csv-upload"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        setUploadingTeams(true);
                        setUploadError('');
                        setUploadSuccess('');

                        try {
                          const token = localStorage.getItem('auth_token');
                          if (!token) {
                            setUploadError('Authentication required. Please log in again.');
                            setUploadingTeams(false);
                            return;
                          }

                          const formData = new FormData();
                          formData.append('file', file);

                          const response = await fetch(
                            `/api/v1/admin/hackathons/${hackathonId}/teams/upload-csv`,
                            {
                              method: 'POST',
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                              body: formData,
                            }
                          );

                          const data = await response.json();

                          if (response.ok) {
                            setUploadSuccess(
                              `Successfully imported ${data.created} team(s) from ${data.processed} row(s).`
                            );
                            if (data.errors && data.errors.length > 0) {
                              setUploadError(`Some errors occurred: ${data.errors.join('; ')}`);
                            }
                            // Reset file input
                            e.target.value = '';
                            // Refresh teams if needed
                            setTimeout(() => {
                              setUploadSuccess('');
                            }, 5000);
                          } else {
                            setUploadError(data.error || 'Failed to upload CSV file');
                          }
                        } catch (error: any) {
                          console.error('CSV upload error:', error);
                          setUploadError('Failed to upload CSV file. Please try again.');
                        } finally {
                          setUploadingTeams(false);
                        }
                      }}
                      disabled={uploadingTeams}
                    />
                    <label
                      htmlFor="csv-upload"
                      className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors ${
                        uploadingTeams ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingTeams ? 'Uploading...' : 'Choose CSV File'}
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      CSV format: team_name, team_description, member_1_email, member_1_first_name, member_1_last_name, member_1_phone, member_1_role, member_1_is_lead, ...
                    </p>
                  </div>

                  {/* Google Sheets (Placeholder for future implementation) */}
                  <div className="border border-gray-300 rounded-lg p-4 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <FileSpreadsheet className="w-5 h-5 text-gray-600" />
                      <h5 className="font-medium text-gray-900">Connect Google Sheet</h5>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      Connect to a Google Sheet to import teams automatically.
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors opacity-50 cursor-not-allowed"
                      disabled
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Coming Soon
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Google Sheets integration will be available soon.
                    </p>
                  </div>
                </div>

                {/* CSV Format Help */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-semibold text-blue-900">CSV Format Guide</h5>
                    <button
                      onClick={downloadCsvTemplate}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download Sample Template
                    </button>
                  </div>
                  <p className="text-xs text-blue-800 mb-2">
                    Your CSV file should include the following columns:
                  </p>
                  <ul className="text-xs text-blue-800 list-disc list-inside space-y-1">
                    <li><strong>team_name</strong> (required) - The name of the team</li>
                    <li><strong>team_description</strong> (optional) - Brief description of the team</li>
                    <li><strong>member_1_email</strong> (required) - First member's email</li>
                    <li><strong>member_1_first_name</strong> (required) - First member's first name</li>
                    <li><strong>member_1_last_name</strong> (required) - First member's last name</li>
                    <li><strong>member_1_phone</strong> (optional) - First member's phone with country code</li>
                    <li><strong>member_1_role</strong> (optional) - First member's role</li>
                    <li><strong>member_1_is_lead</strong> (optional) - "true" if this member is the team lead</li>
                    <li>Repeat for member_2_*, member_3_*, etc. for additional members</li>
                  </ul>
                  <p className="text-xs text-blue-800 mt-2">
                    <strong>Note:</strong> If no team lead is specified, the first member will be designated as the team lead.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'submissions' && (
            <Card>
              <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Submissions</h3>
                
                {/* Search */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const token = localStorage.getItem('auth_token');
                    if (token) {
                      setSubmissionsPagination((p) => ({ ...p, page: 1 }));
                      fetchSubmissions(token, 1, submissionsSearch);
                    }
                  }}
                  className="flex gap-3 mb-4"
                >
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by team name or project name..."
                      value={submissionsSearch}
                      onChange={(e) => setSubmissionsSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Button type="submit" variant="secondary" size="sm">
                    Search
                  </Button>
                  {submissionsSearch && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSubmissionsSearch('');
                        const token = localStorage.getItem('auth_token');
                        if (token) {
                          setSubmissionsPagination((p) => ({ ...p, page: 1 }));
                          fetchSubmissions(token, 1, '');
                        }
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </form>
              </div>

              {submissionsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-600 mt-4">Loading submissions...</p>
                </div>
              ) : submissions.length === 0 ? (
                <p className="text-gray-600">
                  {submissionsSearch ? 'No submissions found matching your search.' : 'No submissions yet'}
                </p>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {submissions.map((submission) => {
                      // Determine submission type based on submission_data structure
                      const hasTeamMembers = Array.isArray(submission.submission_data?.team_members);
                      const hasProjectDetails = submission.submission_data?.project_name || submission.submission_data?.problem_statement || submission.submission_data?.solution;
                      
                      let submissionType = 'General Submission';
                      let submissionTypeColor = 'bg-gray-100 text-gray-700';
                      
                      if (hasTeamMembers) {
                        submissionType = 'Team Formation';
                        submissionTypeColor = 'bg-blue-100 text-blue-700';
                      } else if (hasProjectDetails) {
                        submissionType = 'Project Details';
                        submissionTypeColor = 'bg-green-100 text-green-700';
                      }

                      const teamName = submission.submission_data?.team_name;
                      const projectName = submission.submission_data?.project_name;
                      const teamDescription = submission.submission_data?.team_description;
                      const projectDescription = submission.submission_data?.project_description;
                      const problemStatement = submission.submission_data?.problem_statement;
                      const solution = submission.submission_data?.solution;
                      const githubLink = submission.submission_data?.github_link;
                      const liveLink = submission.submission_data?.live_link;
                      const teamMembers = submission.submission_data?.team_members;

                      return (
                        <div key={submission.submission_id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-semibold text-gray-900">
                                  {projectName || teamName || 'Untitled Submission'}
                                </p>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${submissionTypeColor}`}>
                                  {submissionType}
                                </span>
                                {submission.poll_id && (
                                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">
                                    Poll Submission
                                  </span>
                                )}
                              </div>
                          <p className="text-sm text-gray-500">
                            Submitted: {new Date(submission.submitted_at).toLocaleString()}
                                {submission.submitted_by && ` by ${submission.submitted_by}`}
                              </p>
                              {/* Show poll association if this submission is for a specific poll */}
                              {submission.poll_id && (
                                <p className="text-xs text-purple-600 mt-1">
                                  📊 Poll: {submission.poll_name || submission.poll_id}
                                </p>
                              )}
                        </div>
                            <div className="flex items-center gap-2">
                              {submission.poll_id && (
                                <Link href={`/admin/polls/${submission.poll_id}`}>
                                  <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200">
                                    View Poll
                                  </Badge>
                                </Link>
                              )}
                        {submission.is_locked && (
                          <Badge variant="secondary">Locked</Badge>
                        )}
                      </div>
                          </div>

                          {/* Team Formation Details */}
                          {hasTeamMembers && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              {teamName && (
                                <p className="text-sm text-gray-700 mb-1">
                                  <strong>Team Name:</strong> {teamName}
                        </p>
                      )}
                              {teamDescription && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {teamDescription}
                                </p>
                              )}
                              {teamMembers && Array.isArray(teamMembers) && teamMembers.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-600 mb-1">Team Members ({teamMembers.length}):</p>
                                  <div className="flex flex-wrap gap-2">
                                    {teamMembers.slice(0, 5).map((member: any, idx: number) => (
                                      <span key={idx} className="text-xs px-2 py-1 bg-gray-100 rounded">
                                        {member.firstName} {member.lastName}
                                        {member.isLead && <span className="ml-1 text-blue-600 font-semibold">(Lead)</span>}
                                      </span>
                                    ))}
                                    {teamMembers.length > 5 && (
                                      <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-500">
                                        +{teamMembers.length - 5} more
                                      </span>
                                    )}
                                  </div>
                </div>
                              )}
                            </div>
                          )}

                          {/* Project Details */}
                          {hasProjectDetails && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              {teamName && projectName && (
                                <p className="text-sm text-gray-700 mb-1">
                                  <strong>Submitting Team:</strong> {teamName}
                                </p>
                              )}
                              {projectDescription && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {projectDescription}
                                </p>
                              )}
                              {problemStatement && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium text-gray-600 mb-1">Problem Statement:</p>
                                  <p className="text-sm text-gray-700">{problemStatement}</p>
                                </div>
                              )}
                              {solution && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium text-gray-600 mb-1">Solution:</p>
                                  <p className="text-sm text-gray-700">{solution}</p>
                                </div>
                              )}
                              {(githubLink || liveLink) && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {githubLink && (
                                    <a
                                      href={githubLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                                    >
                                      🔗 GitHub Repository
                                    </a>
                                  )}
                                  {liveLink && (
                                    <a
                                      href={liveLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                                    >
                                      🌐 Live Demo
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {submissionsPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Showing {((submissionsPagination.page - 1) * submissionsPagination.pageSize) + 1} to{' '}
                        {Math.min(submissionsPagination.page * submissionsPagination.pageSize, submissionsPagination.total)} of{' '}
                        {submissionsPagination.total} submissions
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const token = localStorage.getItem('auth_token');
                            if (token) {
                              const newPage = Math.max(1, submissionsPagination.page - 1);
                              setSubmissionsPagination((p) => ({ ...p, page: newPage }));
                              fetchSubmissions(token, newPage, submissionsSearch);
                            }
                          }}
                          disabled={submissionsPagination.page === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const token = localStorage.getItem('auth_token');
                            if (token) {
                              const newPage = Math.min(submissionsPagination.totalPages, submissionsPagination.page + 1);
                              setSubmissionsPagination((p) => ({ ...p, page: newPage }));
                              fetchSubmissions(token, newPage, submissionsSearch);
                            }
                          }}
                          disabled={submissionsPagination.page === submissionsPagination.totalPages}
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          )}
          
          {activeTab === 'polls' && (
            <Card>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Polls</h3>
                  <Link href={`/admin/hackathons/${hackathonId}/polls/create`}>
                    <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white">
                      Create New Poll
                    </Button>
                  </Link>
                </div>
                
                {/* Search and Filter */}
                <div className="flex gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search polls by name..."
                      value={pollsSearch}
                      onChange={(e) => setPollsSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={pollsFilter}
                    onChange={(e) => setPollsFilter(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Polls</option>
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>
              </div>

              {pollsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600">Loading polls...</p>
                </div>
              ) : filteredPolls.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    {polls.length === 0
                      ? 'No polls created yet. Create your first poll to get started.'
                      : 'No polls match your search criteria.'}
                  </p>
                  {polls.length === 0 && (
                    <Link href={`/admin/hackathons/${hackathonId}/polls/create`}>
                      <Button>Create First Poll</Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPolls.map((poll) => {
                    const status = getPollStatus(poll);
                    return (
                      <div
                        key={poll.poll_id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{poll.name}</h4>
                              <Badge
                                variant={
                                  status === 'active'
                                    ? 'success'
                                    : status === 'ended'
                                    ? 'secondary'
                                    : 'warning'
                                }
                              >
                                {status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                              <div>
                                <span className="font-medium">Start:</span>{' '}
                                {new Date(poll.start_time).toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">End:</span>{' '}
                                {new Date(poll.end_time).toLocaleString()}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className="px-2 py-1 bg-gray-100 rounded">
                                Mode: {poll.voting_mode || 'single'}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 rounded">
                                Permissions: {poll.voting_permissions || 'voters_and_judges'}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/admin/polls/${poll.poll_id}`}>
                              <Button variant="secondary" size="sm">
                                Manage
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
