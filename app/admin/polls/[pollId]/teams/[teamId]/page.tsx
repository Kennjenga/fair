'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Input } from '@/components/ui';
import { Sidebar } from '@/components/layouts';

const sidebarItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { label: 'Hackathons', href: '/admin/hackathons', icon: '🏆' },
  { label: 'Polls', href: '/admin/polls', icon: '🗳️' },
];

/**
 * Team details page
 */
export default function TeamDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const pollId = params?.pollId as string;
  const teamId = params?.teamId as string;

  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
    projectDescription: '',
    pitch: '',
    liveSiteUrl: '',
    githubUrl: '',
  });

  useEffect(() => {
    if (!pollId || !teamId) return;

    const token = localStorage.getItem('auth_token');
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }

    const parsed = JSON.parse(adminData);
    setAdmin(parsed);
    fetchTeamDetails(token);
  }, [pollId, teamId, router]);

  const fetchTeamDetails = async (token: string) => {
    if (!pollId || !teamId) return;

    try {
      const response = await fetch(`/api/v1/admin/polls/${pollId}/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin');
        router.push('/admin/login');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load team details');
        setLoading(false);
        return;
      }

      setTeam(data.team);
      setMembers(data.voters || []);

      // Load project details from database columns (preferred) or metadata (fallback)
      setFormData({
        projectName: data.team.project_name || data.team.metadata?.projectName || '',
        projectDescription: data.team.project_description || data.team.metadata?.projectDescription || '',
        pitch: data.team.pitch || data.team.metadata?.pitch || '',
        liveSiteUrl: data.team.live_site_url || data.team.metadata?.liveSiteUrl || '',
        githubUrl: data.team.github_url || data.team.metadata?.githubUrl || '',
      });
    } catch (error) {
      console.error('Failed to fetch team details:', error);
      setError('Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const response = await fetch(`/api/v1/admin/polls/${pollId}/teams/${teamId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: {
            projectName: formData.projectName.trim(),
            projectDescription: formData.projectDescription.trim(),
            pitch: formData.pitch.trim(),
            liveSiteUrl: formData.liveSiteUrl.trim(),
            githubUrl: formData.githubUrl.trim(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update team details');
        setSaving(false);
        return;
      }

      // Update team state with the response immediately
      if (data.team) {
        setTeam(data.team);
        // Update form data from database columns (preferred) or metadata (fallback)
        setFormData({
          projectName: data.team.project_name || data.team.metadata?.projectName || '',
          projectDescription: data.team.project_description || data.team.metadata?.projectDescription || '',
          pitch: data.team.pitch || data.team.metadata?.pitch || '',
          liveSiteUrl: data.team.live_site_url || data.team.metadata?.liveSiteUrl || '',
          githubUrl: data.team.github_url || data.team.metadata?.githubUrl || '',
        });
      }

      setSuccess('Team details updated successfully!');
      setEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setError('Failed to update team details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-[#64748B]">Loading team details...</div>
      </div>
    );
  }

  if (error && !team) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Link
            href={`/admin/polls/${pollId}`}
            className="text-[#4F46E5] hover:text-[#4338CA]"
          >
            ← Back to Poll Management
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar items={sidebarItems} user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href={`/admin/polls/${pollId}`}
              className="text-[#4F46E5] hover:text-[#4338CA] text-sm font-medium flex items-center gap-1 mb-2"
            >
              ← Back to Poll Management
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600">
              {success}
            </div>
          )}

          {team && (
            <div className="space-y-6">
              {/* Team Header */}
              <Card>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold text-[#0F172A] mb-2">{team.team_name}</h2>
                    <div className="text-sm text-[#64748B]">
                      {members.length} member(s) registered
                    </div>
                  </div>
                  <Button
                    onClick={() => setEditing(!editing)}
                    variant={editing ? 'secondary' : 'primary'}
                  >
                    {editing ? 'Cancel' : 'Edit Details'}
                  </Button>
                </div>
              </Card>

              {/* Project Information */}
              <Card>
                <h3 className="text-xl font-semibold text-[#0F172A] mb-6">Project Information</h3>

                {editing ? (
                  <div className="space-y-6">
                    <Input
                      label="Project Name"
                      value={formData.projectName}
                      onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                      placeholder="Enter project name"
                    />

                    <div>
                      <label className="block text-sm font-medium text-[#334155] mb-2">
                        Project Description
                      </label>
                      <textarea
                        value={formData.projectDescription}
                        onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
                        placeholder="Describe the project..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#334155] mb-2">
                        Pitch
                      </label>
                      <textarea
                        value={formData.pitch}
                        onChange={(e) => setFormData({ ...formData, pitch: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
                        placeholder="Enter your pitch..."
                        rows={4}
                      />
                    </div>

                    <Input
                      label="Live Site URL"
                      type="url"
                      value={formData.liveSiteUrl}
                      onChange={(e) => setFormData({ ...formData, liveSiteUrl: e.target.value })}
                      placeholder="https://example.com"
                    />

                    <Input
                      label="GitHub Repository URL"
                      type="url"
                      value={formData.githubUrl}
                      onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                      placeholder="https://github.com/username/repo"
                    />

                    <div className="flex gap-3 justify-end pt-2">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditing(false);
                          setError('');
                          // Reset form data to current team data (prefer columns over metadata)
                          if (team) {
                            setFormData({
                              projectName: team.project_name || team.metadata?.projectName || '',
                              projectDescription: team.project_description || team.metadata?.projectDescription || '',
                              pitch: team.pitch || team.metadata?.pitch || '',
                              liveSiteUrl: team.live_site_url || team.metadata?.liveSiteUrl || '',
                              githubUrl: team.github_url || team.metadata?.githubUrl || '',
                            });
                          }
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        isLoading={saving}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <span className="font-medium text-[#64748B] block mb-1">Project Name</span>
                      <div className="text-[#0F172A] text-lg">
                        {(team.project_name || team.metadata?.projectName)?.trim() ? (
                          team.project_name || team.metadata?.projectName
                        ) : (
                          <span className="text-[#94A3B8] italic">Not provided</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="font-medium text-[#64748B] block mb-1">Project Description</span>
                      <div className="text-[#0F172A] whitespace-pre-wrap">
                        {(team.project_description || team.metadata?.projectDescription)?.trim() ? (
                          team.project_description || team.metadata?.projectDescription
                        ) : (
                          <span className="text-[#94A3B8] italic">Not provided</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="font-medium text-[#64748B] block mb-1">Pitch</span>
                      <div className="text-[#0F172A] whitespace-pre-wrap">
                        {(team.pitch || team.metadata?.pitch)?.trim() ? (
                          team.pitch || team.metadata?.pitch
                        ) : (
                          <span className="text-[#94A3B8] italic">Not provided</span>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <span className="font-medium text-[#64748B] block mb-1">Live Site</span>
                        <div className="text-[#0F172A]">
                          {(team.live_site_url || team.metadata?.liveSiteUrl)?.trim() ? (
                            <a
                              href={team.live_site_url || team.metadata?.liveSiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#4F46E5] hover:text-[#4338CA] underline break-all"
                            >
                              {team.live_site_url || team.metadata?.liveSiteUrl}
                            </a>
                          ) : (
                            <span className="text-[#94A3B8] italic">Not provided</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="font-medium text-[#64748B] block mb-1">GitHub Repository</span>
                        <div className="text-[#0F172A]">
                          {(team.github_url || team.metadata?.githubUrl)?.trim() ? (
                            <a
                              href={team.github_url || team.metadata?.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#4F46E5] hover:text-[#4338CA] underline break-all"
                            >
                              {team.github_url || team.metadata?.githubUrl}
                            </a>
                          ) : (
                            <span className="text-[#94A3B8] italic">Not provided</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Team Members */}
              <Card>
                <h3 className="text-xl font-semibold text-[#0F172A] mb-6">
                  Team Members ({members.length})
                </h3>

                {members.length === 0 ? (
                  <p className="text-[#64748B]">No members registered for this team yet.</p>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.tokenId} className="border border-[#E2E8F0] rounded-xl p-4 bg-[#F8FAFC]">
                        <div className="font-medium text-[#0F172A]">{member.email}</div>
                        <div className="text-sm text-[#64748B] mt-1">
                          Status: <span className={member.used ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>{member.used ? 'Voted' : 'Not Voted'}</span>
                          {member.issuedAt && (
                            <span> • Registered: {new Date(member.issuedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

