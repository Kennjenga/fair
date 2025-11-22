'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layouts';
import { Button, Card, Badge } from '@/components/ui';

const sidebarItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { label: 'Hackathons', href: '/admin/hackathons', icon: '🏆' },
    { label: 'Polls', href: '/admin/polls', icon: '🗳️' },
];

// Calculate stats from polls
function calculateStats(polls: any[]) {
    const now = new Date();
    const stats = {
        total: polls.length,
        active: 0,
        upcoming: 0,
        ended: 0,
    };

    polls.forEach((poll) => {
        const startTime = new Date(poll.start_time);
        const endTime = new Date(poll.end_time);

        if (startTime <= now && endTime >= now) {
            stats.active++;
        } else if (endTime < now) {
            stats.ended++;
        } else {
            stats.upcoming++;
        }
    });

    return stats;
}

/**
 * Polls list page with modern design
 */
export default function PollsPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
    const [polls, setPolls] = useState<any[]>([]);
    const [dashboard, setDashboard] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'ended' | 'upcoming'>('all');

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('auth_token');
        const adminData = localStorage.getItem('admin');

        if (!token || !adminData) {
            router.push('/admin/login');
            return;
        }

        const parsed = JSON.parse(adminData);
        setAdmin(parsed);

        // Fetch polls and dashboard data
        fetchData(token);
    }, [router]);

    const fetchData = async (token: string) => {
        try {
            const [dashboardRes] = await Promise.all([
                fetch('/api/v1/admin/dashboard', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (dashboardRes.status === 401) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('admin');
                router.push('/admin/login');
                return;
            }

            const dashboardData = dashboardRes.ok ? await dashboardRes.json() : null;

            // Set dashboard stats with defaults if needed
            if (dashboardData && dashboardData.stats) {
                setDashboard(dashboardData);
                // Extract polls from dashboard data
                setPolls(dashboardData.allPolls || []);
            } else {
                setDashboard({
                    stats: {
                        totalHackathons: 0,
                        totalPolls: 0,
                        activePolls: 0,
                        endedPolls: 0,
                        upcomingPolls: 0,
                        totalVotes: 0,
                        totalTokens: 0,
                        usedTokens: 0,
                        totalTeams: 0,
                        totalJudges: 0,
                    },
                    allPolls: [],
                });
                setPolls([]);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setDashboard({
                stats: {
                    totalHackathons: 0,
                    totalPolls: 0,
                    activePolls: 0,
                    endedPolls: 0,
                    upcomingPolls: 0,
                    totalVotes: 0,
                    totalTokens: 0,
                    usedTokens: 0,
                    totalTeams: 0,
                    totalJudges: 0,
                },
                allPolls: [],
            });
            setPolls([]);
        } finally {
            setLoading(false);
        }
    };

    const getPollStatus = (poll: any) => {
        const now = new Date();
        const startTime = new Date(poll.start_time);
        const endTime = new Date(poll.end_time);

        if (startTime <= now && endTime >= now) return 'active';
        if (endTime < now) return 'ended';
        return 'upcoming';
    };

    const filteredPolls = polls.filter((poll) => {
        // Filter by status
        if (filterStatus !== 'all') {
            const status = getPollStatus(poll);
            if (status !== filterStatus) return false;
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return poll.name.toLowerCase().includes(query);
        }

        return true;
    });

    const stats = calculateStats(polls);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-[#64748B]">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex">
            {/* Sidebar */}
            <Sidebar items={sidebarItems} user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            {/* Main content */}
            <main className="flex-1 p-6 md:p-8 overflow-auto">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Polls</h1>
                        <p className="text-[#64748B]">
                            Manage all your voting polls
                            {admin && (
                                <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 text-[#4F46E5]">
                                    {admin.role === 'hackathon_manager' ? 'Hackathon Manager' : admin.role === 'organiser' ? 'Organiser' : admin.role.replace('_', ' ')}
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                            { label: 'Total Polls', value: stats.total, icon: '📊', gradient: 'from-[#4F46E5] to-[#6366F1]', borderColor: 'border-[#4F46E5]' },
                            { label: 'Active Polls', value: stats.active, icon: '⚡', gradient: 'from-[#0EA5E9] to-[#38BDF8]', borderColor: 'border-[#0EA5E9]' },
                            { label: 'Upcoming', value: stats.upcoming, icon: '📅', gradient: 'from-[#F59E0B] to-[#FBBF24]', borderColor: 'border-[#F59E0B]' },
                            { label: 'Ended', value: stats.ended, icon: '✅', gradient: 'from-[#64748B] to-[#94A3B8]', borderColor: 'border-[#64748B]' },
                        ].map((stat, idx) => (
                            <Card
                                key={idx}
                                className={`hover:shadow-2xl transition-all duration-300 motion-reduce:transition-none border-l-4 ${stat.borderColor} group`}
                                role="region"
                                aria-label={`${stat.label}: ${stat.value}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[#64748B] text-sm font-medium mb-2">{stat.label}</p>
                                        <p className={`text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent transition-transform group-hover:scale-105 duration-300 motion-reduce:transform-none`}>
                                            {stat.value}
                                        </p>
                                    </div>
                                    <div className="text-5xl opacity-80 transition-transform group-hover:scale-110 group-hover:rotate-6 duration-300 motion-reduce:transform-none" aria-hidden="true">{stat.icon}</div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Search and Filter */}
                    <div className="mb-6 flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search polls by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {(['all', 'active', 'upcoming', 'ended'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#4F46E5] ${filterStatus === status
                                        ? 'bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white shadow-lg'
                                        : 'bg-white text-[#64748B] hover:bg-[#F8FAFC] border border-[#E2E8F0]'
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Polls List */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-[#0F172A]">
                            {filterStatus === 'all' ? 'All Polls' : `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Polls`}
                            <span className="text-[#64748B] text-lg ml-2">({filteredPolls.length})</span>
                        </h2>
                    </div>

                    {filteredPolls.length === 0 ? (
                        <Card className="text-center py-12 bg-gradient-to-br from-white to-[#F8FAFC]">
                            <div className="text-6xl mb-4">🗳️</div>
                            <p className="text-[#64748B] mb-4">
                                {searchQuery || filterStatus !== 'all'
                                    ? 'No polls match your filters'
                                    : 'No polls yet. Polls are created within hackathons.'}
                            </p>
                            {!searchQuery && filterStatus === 'all' && (
                                <Link href="/admin/hackathons">
                                    <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1]">
                                        Go to Hackathons
                                    </Button>
                                </Link>
                            )}
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {filteredPolls.map((poll) => {
                                const status = getPollStatus(poll);
                                const statusConfig = {
                                    active: { color: 'bg-[#0EA5E9] text-white', label: 'Active' },
                                    upcoming: { color: 'bg-[#F59E0B] text-white', label: 'Upcoming' },
                                    ended: { color: 'bg-[#64748B] text-white', label: 'Ended' },
                                };

                                return (
                                    <Card
                                        key={poll.poll_id}
                                        className="hover:shadow-xl transition-all border-l-4 border-[#4F46E5]/20 hover:border-[#4F46E5]"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-semibold text-[#0F172A]">{poll.name}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[status].color}`}>
                                                        {statusConfig[status].label}
                                                    </span>
                                                    {poll.is_tie_breaker && (
                                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E]">
                                                            Tie-Breaker
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-4 text-sm text-[#64748B] mb-2">
                                                    <span>
                                                        📅 {new Date(poll.start_time).toLocaleDateString()} - {new Date(poll.end_time).toLocaleDateString()}
                                                    </span>
                                                    <span>🗳️ Mode: {poll.voting_mode || 'single'}</span>
                                                    <span>
                                                        👥 {poll.voting_permissions === 'voters_only'
                                                            ? 'Voters Only'
                                                            : poll.voting_permissions === 'judges_only'
                                                                ? 'Judges Only'
                                                                : 'Voters & Judges'}
                                                    </span>
                                                </div>
                                            </div>
                                            <Link href={`/admin/polls/${poll.poll_id}`}>
                                                <Button size="sm" className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#4F46E5]">
                                                    Manage
                                                </Button>
                                            </Link>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
