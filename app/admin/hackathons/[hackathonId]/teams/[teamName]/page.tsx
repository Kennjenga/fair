'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layouts';
import { Card, Badge } from '@/components/ui';
import { ArrowLeft, Users, Mail, Phone, User, ExternalLink, Github } from 'lucide-react';

const sidebarItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { label: 'Hackathons', href: '/admin/hackathons', icon: '🏆' },
  { label: 'Polls', href: '/admin/polls', icon: '🗳️' },
];

/**
 * Team data structure
 */
interface Team {
  submissionId: string;
  teamName: string;
  teamDescription: string | null;
  teamMembers: Array<{
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
    isLead: boolean;
  }>;
  submittedBy: string | null;
  submittedAt: string;
  projectName: string | null;
  problemStatement: string | null;
  solution: string | null;
  githubLink: string | null;
  liveLink: string | null;
  pollId: string | null;
}

export default function TeamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const hackathonId = params.hackathonId as string;
  const teamName = decodeURIComponent(params.teamName as string);

  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }

    const parsed = JSON.parse(adminData);
    setAdmin(parsed);

    fetchTeamDetails();
  }, [hackathonId, teamName, router]);

  const fetchTeamDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      // Fetch teams and find the one matching teamName
      const response = await fetch(
        `/api/v1/admin/hackathons/${hackathonId}/teams?search=${encodeURIComponent(teamName)}&pageSize=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const foundTeam = data.teams.find((t: Team) => t.teamName === teamName);
        if (foundTeam) {
          setTeam(foundTeam);
        }
      }
    } catch (error) {
      console.error('Error fetching team details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex">
        <Sidebar items={sidebarItems} user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <Card>
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 mt-4">Loading team details...</p>
              </div>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex">
        <Sidebar items={sidebarItems} user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <Card>
              <div className="text-center py-12">
                <p className="text-gray-600">Team not found.</p>
                <Link
                  href={`/admin/hackathons/${hackathonId}/teams`}
                  className="text-blue-600 hover:text-blue-700 mt-4 inline-block"
                >
                  ← Back to Teams
                </Link>
              </div>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const teamLead = team.teamMembers.find((m) => m.isLead);
  const regularMembers = team.teamMembers.filter((m) => !m.isLead);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar items={sidebarItems} user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href={`/admin/hackathons/${hackathonId}/teams`}
              className="text-[#4F46E5] hover:text-[#4338CA] text-sm font-medium flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Teams
            </Link>
            <h1 className="text-3xl font-bold text-[#0F172A]">{team.teamName}</h1>
            {team.teamDescription && (
              <p className="text-[#64748B] mt-2">{team.teamDescription}</p>
            )}
            <div className="flex gap-2 mt-3">
              {team.pollId && (
                <Badge variant="secondary">
                  <Link href={`/admin/polls/${team.pollId}`} className="hover:underline">
                    View Poll
                  </Link>
                </Badge>
              )}
              <span className="text-sm text-gray-500">
                Submitted: {new Date(team.submittedAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Team Members Section */}
          <Card className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members ({team.teamMembers.length})
            </h2>

            {/* Team Lead */}
            {teamLead && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Team Lead</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                      {teamLead.firstName?.[0] || teamLead.email?.[0] || 'L'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">
                          {teamLead.firstName} {teamLead.lastName}
                        </p>
                        <Badge variant="secondary" className="text-xs">Lead</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {teamLead.email}
                        </div>
                        {teamLead.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {teamLead.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {teamLead.role}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other Members */}
            {regularMembers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Team Members ({regularMembers.length})
                </h3>
                <div className="space-y-3">
                  {regularMembers.map((member, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center font-semibold">
                          {member.firstName?.[0] || member.email?.[0] || 'M'}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {member.firstName} {member.lastName}
                          </p>
                          <div className="space-y-1 text-sm text-gray-600 mt-1">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {member.email}
                            </div>
                            {member.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                {member.phone}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {member.role}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Project Details Section */}
          {team.projectName && (
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Details</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Project Name</h3>
                  <p className="text-gray-900">{team.projectName}</p>
                </div>

                {team.problemStatement && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Problem Statement</h3>
                    <p className="text-gray-900 whitespace-pre-wrap">{team.problemStatement}</p>
                  </div>
                )}

                {team.solution && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Proposed Solution</h3>
                    <p className="text-gray-900 whitespace-pre-wrap">{team.solution}</p>
                  </div>
                )}

                {(team.githubLink || team.liveLink) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Links</h3>
                    <div className="flex flex-wrap gap-3">
                      {team.githubLink && (
                        <a
                          href={team.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                        >
                          <Github className="w-4 h-4" />
                          GitHub Repository
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {team.liveLink && (
                        <a
                          href={team.liveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Live Demo
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {!team.projectName && (
            <Card>
              <div className="text-center py-8 text-gray-500">
                <p>No project details submitted yet for this team.</p>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
