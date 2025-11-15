'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Team details page
 */
export default function TeamDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const pollId = params?.pollId as string;
  const teamId = params?.teamId as string;
  
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
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

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-[#64748b]">Loading team details...</div>
      </div>
    );
  }

  if (error && !team) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Link
            href={`/admin/polls/${pollId}`}
            className="text-[#0891b2] hover:text-[#0e7490]"
          >
            ← Back to Poll Management
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
          <div>
            <h1 className="text-2xl font-bold text-[#1e40af]">FAIR Admin Dashboard</h1>
            <Link
              href={`/admin/polls/${pollId}`}
              className="text-sm text-[#0891b2] hover:text-[#0e7490] mt-1"
            >
              ← Back to Poll Management
            </Link>
          </div>
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
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
            {success}
          </div>
        )}

        {team && (
          <div className="space-y-6">
            {/* Team Header */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-[#0f172a] mb-2">{team.team_name}</h2>
                  <div className="text-sm text-[#64748b]">
                    {members.length} member(s) registered
                  </div>
                </div>
                <button
                  onClick={() => setEditing(!editing)}
                  className="px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors"
                >
                  {editing ? 'Cancel' : 'Edit Details'}
                </button>
              </div>
            </div>

            {/* Project Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Project Information</h3>
              
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0f172a] mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={formData.projectName}
                      onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                      className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                      placeholder="Enter project name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#0f172a] mb-1">
                      Project Description
                    </label>
                    <textarea
                      value={formData.projectDescription}
                      onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                      className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                      placeholder="Describe the project..."
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#0f172a] mb-1">
                      Pitch
                    </label>
                    <textarea
                      value={formData.pitch}
                      onChange={(e) => setFormData({ ...formData, pitch: e.target.value })}
                      className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                      placeholder="Enter your pitch..."
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#0f172a] mb-1">
                      Live Site URL
                    </label>
                    <input
                      type="url"
                      value={formData.liveSiteUrl}
                      onChange={(e) => setFormData({ ...formData, liveSiteUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#0f172a] mb-1">
                      GitHub Repository URL
                    </label>
                    <input
                      type="url"
                      value={formData.githubUrl}
                      onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-[#94a3b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                      placeholder="https://github.com/username/repo"
                    />
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <button
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
                      className="px-4 py-2 text-[#64748b] hover:text-[#0f172a]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-[#059669] text-white rounded-lg hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="font-medium text-[#64748b]">Project Name:</span>
                    <div className="text-[#0f172a] mt-1">
                      {(team.project_name || team.metadata?.projectName)?.trim() ? (
                        team.project_name || team.metadata?.projectName
                      ) : (
                        <span className="text-[#94a3b8] italic">Not provided</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-[#64748b]">Project Description:</span>
                    <div className="text-[#0f172a] mt-1 whitespace-pre-wrap">
                      {(team.project_description || team.metadata?.projectDescription)?.trim() ? (
                        team.project_description || team.metadata?.projectDescription
                      ) : (
                        <span className="text-[#94a3b8] italic">Not provided</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-[#64748b]">Pitch:</span>
                    <div className="text-[#0f172a] mt-1 whitespace-pre-wrap">
                      {(team.pitch || team.metadata?.pitch)?.trim() ? (
                        team.pitch || team.metadata?.pitch
                      ) : (
                        <span className="text-[#94a3b8] italic">Not provided</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-[#64748b]">Live Site:</span>
                    <div className="text-[#0f172a] mt-1">
                      {(team.live_site_url || team.metadata?.liveSiteUrl)?.trim() ? (
                        <a
                          href={team.live_site_url || team.metadata?.liveSiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0891b2] hover:text-[#0e7490] underline break-all"
                        >
                          {team.live_site_url || team.metadata?.liveSiteUrl}
                        </a>
                      ) : (
                        <span className="text-[#94a3b8] italic">Not provided</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-[#64748b]">GitHub Repository:</span>
                    <div className="text-[#0f172a] mt-1">
                      {(team.github_url || team.metadata?.githubUrl)?.trim() ? (
                        <a
                          href={team.github_url || team.metadata?.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0891b2] hover:text-[#0e7490] underline break-all"
                        >
                          {team.github_url || team.metadata?.githubUrl}
                        </a>
                      ) : (
                        <span className="text-[#94a3b8] italic">Not provided</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Team Members */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-[#0f172a] mb-4">
                Team Members ({members.length})
              </h3>
              
              {members.length === 0 ? (
                <p className="text-[#64748b]">No members registered for this team yet.</p>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.tokenId} className="border border-[#e2e8f0] rounded-lg p-4">
                      <div className="font-medium text-[#0f172a]">{member.email}</div>
                      <div className="text-sm text-[#64748b] mt-1">
                        Status: {member.used ? 'Voted' : 'Not Voted'}
                        {member.issuedAt && (
                          <span> • Registered: {new Date(member.issuedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

