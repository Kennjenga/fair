'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Input, DateTimeInput } from '@/components/ui';
import { Sidebar } from '@/components/layouts';


/**
 * Create hackathon page content component (uses useSearchParams)
 */
function CreateHackathonPageContent() {
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
  // Template-specific configuration data (stored in governance_config)
  const [templateConfig, setTemplateConfig] = useState<Record<string, any>>({});
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
      
      // Merge template config with custom template-specific settings
      const customConfig = templateId && Object.keys(templateConfig).length > 0
        ? {
            ...template.config,
            templateSettings: templateConfig, // Store template-specific settings separately
          }
        : undefined;

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
            customConfig, // Include template-specific settings
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
      <Sidebar user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Create New Hackathon</h1>
          {template && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 border border-[#4F46E5]/20 rounded-xl p-4 mb-4">
                <p className="text-[#64748B] mb-2">
                  Using template: <span className="font-semibold text-[#4F46E5]">{template.name}</span>
                </p>
                <p className="text-sm text-[#64748B]">
                  {template.description}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">⚠️ Important: Pre-committed Governance Model</p>
                <p className="text-sm text-blue-800">
                  Selecting this template is equivalent to accepting a decision constitution for your hackathon. 
                  The governance rules, integrity guarantees, and outcome logic are pre-committed and cannot be changed after launch.
                </p>
              </div>
            </div>
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
              <DateTimeInput
                label="Voting Closes At"
                id="votingClosesAt"
                value={formData.votingClosesAt}
                onChange={(value) => setFormData({ ...formData, votingClosesAt: value })}
                helperText="When voting closes, the hackathon status will automatically change to 'closed'. When the end date is reached, status changes to 'finalized'."
              />

              {/* Deadlines (only show if using template) */}
              {templateId && (
                <div className="grid md:grid-cols-2 gap-6">
                  <DateTimeInput
                    label="Submission Deadline"
                    id="submissionDeadline"
                    value={formData.submissionDeadline}
                    onChange={(value) => setFormData({ ...formData, submissionDeadline: value })}
                  />

                  <DateTimeInput
                    label="Evaluation Deadline"
                    id="evaluationDeadline"
                    value={formData.evaluationDeadline}
                    onChange={(value) => setFormData({ ...formData, evaluationDeadline: value })}
                  />
                </div>
              )}

              {/* Template-Specific Configuration Fields */}
              {template && (() => {
                const governanceModel = template.governanceModel || template.governance_model;
                
                // Centralized Template: Minimum judges
                if (governanceModel === 'centralized') {
                  return (
                    <div className="border border-[#E2E8F0] rounded-xl p-6 bg-white">
                      <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Judging Configuration</h3>
                      <Input
                        label="Minimum Judges Required"
                        id="centralized_minJudges"
                        type="number"
                        min="1"
                        value={templateConfig.centralized_minJudges || ''}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, centralized_minJudges: parseInt(e.target.value) || 1 })}
                        placeholder="e.g., 3"
                      />
                    </div>
                  );
                }

                // Community-Led Template: Voter settings
                if (governanceModel === 'community_led') {
                  return (
                    <div className="border border-[#E2E8F0] rounded-xl p-6 bg-white">
                      <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Voting Configuration</h3>
                      <div className="space-y-4">
                        <Input
                          label="Minimum Voters Required"
                          id="community_minVoters"
                          type="number"
                          min="1"
                          value={templateConfig.community_minVoters || ''}
                          onChange={(e) => setTemplateConfig({ ...templateConfig, community_minVoters: parseInt(e.target.value) || 10 })}
                          placeholder="e.g., 10"
                        />
                        <div>
                          <label htmlFor="community_voterEligibility" className="block text-sm font-medium text-[#334155] mb-2">
                            Voter Eligibility Rules
                          </label>
                          <input
                            id="community_voterEligibility"
                            type="text"
                            value={templateConfig.community_voterEligibility || ''}
                            onChange={(e) => setTemplateConfig({ ...templateConfig, community_voterEligibility: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
                            placeholder="e.g., Registered participants only"
                          />
                        </div>
                      </div>
                    </div>
                  );
                }

                // Sponsor-Driven Template: Sponsor tracks
                if (governanceModel === 'sponsor_driven') {
                  const tracks = templateConfig.sponsor_tracks || ['General'];
                  return (
                    <div className="border border-[#E2E8F0] rounded-xl p-6 bg-white">
                      <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Sponsor Tracks</h3>
                      <div className="space-y-3">
                        {tracks.map((track: string, idx: number) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text"
                              value={track}
                              onChange={(e) => {
                                const newTracks = [...tracks];
                                newTracks[idx] = e.target.value;
                                setTemplateConfig({ ...templateConfig, sponsor_tracks: newTracks });
                              }}
                              className="flex-1 px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
                              placeholder="Track name"
                            />
                            {tracks.length > 1 && (
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                  const newTracks = tracks.filter((_: any, i: number) => i !== idx);
                                  setTemplateConfig({ ...templateConfig, sponsor_tracks: newTracks });
                                }}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setTemplateConfig({ ...templateConfig, sponsor_tracks: [...tracks, ''] });
                          }}
                        >
                          + Add Track
                        </Button>
                      </div>
                    </div>
                  );
                }

                // DAO-Managed Template: DAO settings
                if (governanceModel === 'dao_managed') {
                  return (
                    <div className="border border-[#E2E8F0] rounded-xl p-6 bg-white">
                      <h3 className="text-lg font-semibold text-[#0F172A] mb-4">DAO Configuration</h3>
                      <div className="space-y-4">
                        <Input
                          label="Token Contract Address"
                          id="dao_tokenContract"
                          type="text"
                          value={templateConfig.dao_tokenContract || ''}
                          onChange={(e) => setTemplateConfig({ ...templateConfig, dao_tokenContract: e.target.value })}
                          placeholder="0x..."
                        />
                        <div className="grid md:grid-cols-2 gap-4">
                          <Input
                            label="Quorum Threshold (%)"
                            id="dao_quorumThreshold"
                            type="number"
                            min="0"
                            max="100"
                            value={templateConfig.dao_quorumThreshold || ''}
                            onChange={(e) => setTemplateConfig({ ...templateConfig, dao_quorumThreshold: parseFloat(e.target.value) || 0 })}
                            placeholder="e.g., 50"
                          />
                          <Input
                            label="Voting Threshold (%)"
                            id="dao_votingThreshold"
                            type="number"
                            min="0"
                            max="100"
                            value={templateConfig.dao_votingThreshold || ''}
                            onChange={(e) => setTemplateConfig({ ...templateConfig, dao_votingThreshold: parseFloat(e.target.value) || 0 })}
                            placeholder="e.g., 51"
                          />
                        </div>
                      </div>
                    </div>
                  );
                }

                // Hybrid Template: Weight distribution
                if (governanceModel === 'hybrid') {
                  const judgeWeight = templateConfig.hybrid_judgeWeight || 0.5;
                  const sponsorWeight = templateConfig.hybrid_sponsorWeight || 0.3;
                  const communityWeight = templateConfig.hybrid_communityWeight || 0.2;
                  const total = judgeWeight + sponsorWeight + communityWeight;
                  
                  return (
                    <div className="border border-[#E2E8F0] rounded-xl p-6 bg-white">
                      <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Stakeholder Weights</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="hybrid_judgeWeight" className="block text-sm font-medium text-[#334155] mb-2">
                            Judge Weight ({judgeWeight * 100}%)
                          </label>
                          <input
                            id="hybrid_judgeWeight"
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={judgeWeight}
                            onChange={(e) => {
                              const newJudge = parseFloat(e.target.value);
                              const remaining = 1 - newJudge;
                              const newSponsor = Math.min(sponsorWeight, remaining * (sponsorWeight / (sponsorWeight + communityWeight || 1)));
                              const newCommunity = remaining - newSponsor;
                              setTemplateConfig({
                                ...templateConfig,
                                hybrid_judgeWeight: newJudge,
                                hybrid_sponsorWeight: newSponsor,
                                hybrid_communityWeight: newCommunity,
                              });
                            }}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label htmlFor="hybrid_sponsorWeight" className="block text-sm font-medium text-[#334155] mb-2">
                            Sponsor Weight ({sponsorWeight * 100}%)
                          </label>
                          <input
                            id="hybrid_sponsorWeight"
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={sponsorWeight}
                            onChange={(e) => {
                              const newSponsor = parseFloat(e.target.value);
                              const remaining = 1 - judgeWeight;
                              const newCommunity = remaining - newSponsor;
                              if (newCommunity >= 0) {
                                setTemplateConfig({
                                  ...templateConfig,
                                  hybrid_sponsorWeight: newSponsor,
                                  hybrid_communityWeight: newCommunity,
                                });
                              }
                            }}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label htmlFor="hybrid_communityWeight" className="block text-sm font-medium text-[#334155] mb-2">
                            Community Weight ({communityWeight * 100}%)
                          </label>
                          <input
                            id="hybrid_communityWeight"
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={communityWeight}
                            onChange={(e) => {
                              const newCommunity = parseFloat(e.target.value);
                              const remaining = 1 - judgeWeight;
                              const newSponsor = remaining - newCommunity;
                              if (newSponsor >= 0) {
                                setTemplateConfig({
                                  ...templateConfig,
                                  hybrid_sponsorWeight: newSponsor,
                                  hybrid_communityWeight: newCommunity,
                                });
                              }
                            }}
                            className="w-full"
                          />
                        </div>
                        <div className={`text-sm p-3 rounded-lg ${Math.abs(total - 1.0) < 0.01 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                          Total: {(total * 100).toFixed(1)}% {Math.abs(total - 1.0) < 0.01 ? '✓' : '(must equal 100%)'}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Rolling Template: Evaluation settings
                if (governanceModel === 'rolling') {
                  return (
                    <div className="border border-[#E2E8F0] rounded-xl p-6 bg-white">
                      <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Evaluation Schedule</h3>
                      <div className="space-y-4">
                        <Input
                          label="Evaluation Frequency (days)"
                          id="rolling_evaluationFrequency"
                          type="number"
                          min="1"
                          value={templateConfig.rolling_evaluationFrequency || ''}
                          onChange={(e) => setTemplateConfig({ ...templateConfig, rolling_evaluationFrequency: parseInt(e.target.value) || 7 })}
                          placeholder="e.g., 7"
                        />
                        <Input
                          label="Batch Size (submissions per evaluation)"
                          id="rolling_batchSize"
                          type="number"
                          min="1"
                          value={templateConfig.rolling_batchSize || ''}
                          onChange={(e) => setTemplateConfig({ ...templateConfig, rolling_batchSize: parseInt(e.target.value) || 10 })}
                          placeholder="e.g., 10"
                        />
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="rolling_allowResubmission"
                            checked={templateConfig.rolling_allowResubmission || false}
                            onChange={(e) => setTemplateConfig({ ...templateConfig, rolling_allowResubmission: e.target.checked })}
                            className="w-4 h-4 text-[#4F46E5] border-[#E2E8F0] rounded focus:ring-[#4F46E5]"
                          />
                          <label htmlFor="rolling_allowResubmission" className="text-sm font-medium text-[#334155]">
                            Allow resubmission of improved projects
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Pilot Template: Transparency settings
                if (governanceModel === 'pilot') {
                  return (
                    <div className="border border-[#E2E8F0] rounded-xl p-6 bg-white">
                      <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Transparency Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="pilot_transparencyLevel" className="block text-sm font-medium text-[#334155] mb-2">
                            Transparency Level
                          </label>
                          <select
                            id="pilot_transparencyLevel"
                            value={templateConfig.pilot_transparencyLevel || 'maximum'}
                            onChange={(e) => setTemplateConfig({ ...templateConfig, pilot_transparencyLevel: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
                          >
                            <option value="maximum">Maximum (All data public)</option>
                            <option value="high">High (Most data public)</option>
                            <option value="standard">Standard (Selected data public)</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="pilot_publicAuditLog"
                            checked={templateConfig.pilot_publicAuditLog !== false}
                            onChange={(e) => setTemplateConfig({ ...templateConfig, pilot_publicAuditLog: e.target.checked })}
                            className="w-4 h-4 text-[#4F46E5] border-[#E2E8F0] rounded focus:ring-[#4F46E5]"
                          />
                          <label htmlFor="pilot_publicAuditLog" className="text-sm font-medium text-[#334155]">
                            Enable public audit log
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
              })()}


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

/**
 * Create hackathon page (supports template-based creation)
 * Wrapped in Suspense to handle useSearchParams()
 */
export default function CreateHackathonPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-[#64748B]">Loading...</div>
      </div>
    }>
      <CreateHackathonPageContent />
    </Suspense>
  );
}
