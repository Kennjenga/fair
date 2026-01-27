'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layouts';
import { Button, Card, Input } from '@/components/ui';
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';

const sidebarItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { label: 'Hackathons', href: '/admin/hackathons', icon: '🏆' },
  { label: 'Polls', href: '/admin/polls', icon: '🗳️' },
];

/**
 * Team data structure from the API
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

export default function HackathonTeamsPage() {
  const router = useRouter();
  const params = useParams();
  const hackathonId = params.hackathonId as string;

  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }

    const parsed = JSON.parse(adminData);
    setAdmin(parsed);

    fetchTeams();
  }, [hackathonId, currentPage, searchQuery, router]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      // Build query string with pagination and search
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '10',
      });
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(
        `/api/v1/admin/hackathons/${hackathonId}/teams?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchTeams();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar items={sidebarItems} user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href={`/admin/hackathons/${hackathonId}`}
              className="text-[#4F46E5] hover:text-[#4338CA] text-sm font-medium flex items-center gap-1 mb-2"
            >
              ← Back to Hackathon
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#0F172A]">Teams</h1>
                <p className="text-[#64748B] mt-1">
                  View and manage teams from submissions ({pagination.total} total)
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search teams by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
              {searchQuery && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                >
                  Clear
                </Button>
              )}
            </form>
          </Card>

          {/* Teams List */}
          {loading ? (
            <Card>
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 mt-4">Loading teams...</p>
              </div>
            </Card>
          ) : teams.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchQuery ? 'No teams found matching your search.' : 'No teams found yet.'}
                </p>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 mb-6">
                {teams.map((team) => (
                  <Card key={team.submissionId} className="hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link
                          href={`/admin/hackathons/${hackathonId}/teams/${encodeURIComponent(team.teamName)}`}
                          className="block"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-[#4F46E5] transition-colors">
                            {team.teamName}
                          </h3>
                        </Link>
                        {team.teamDescription && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {team.teamDescription}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                          <span>
                            <Users className="w-4 h-4 inline mr-1" />
                            {team.teamMembers.length} member{team.teamMembers.length !== 1 ? 's' : ''}
                          </span>
                          {team.projectName && (
                            <span className="text-blue-600">📊 Has Project</span>
                          )}
                          {team.pollId && (
                            <span className="text-purple-600">🗳️ Poll Submission</span>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/admin/hackathons/${hackathonId}/teams/${encodeURIComponent(team.teamName)}`}
                      >
                        <Button variant="secondary" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Card>
                  <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * pagination.pageSize) + 1} to{' '}
                      {Math.min(currentPage * pagination.pageSize, pagination.total)} of{' '}
                      {pagination.total} teams
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={currentPage === pagination.totalPages}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
