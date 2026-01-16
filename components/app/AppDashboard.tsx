'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Vote, User, RefreshCw, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui';

interface Decision {
    id: string;
    title: string;
    description: string;
    status: 'active' | 'closed';
    endDate: string;
    isVerified: boolean;
    participantCount: number;
}

/**
 * Mobile-optimized decision dashboard for app mode
 * Features pull-to-refresh, bottom navigation, and subtle verified badges
 * Uses existing design system with app-focused layout
 */
export function AppDashboard() {
    const [activeTab, setActiveTab] = useState('home');
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [startY, setStartY] = useState(0);

    useEffect(() => {
        loadDecisions();
    }, []);

    const loadDecisions = async () => {
        // Mock data for demonstration
        // TODO: Replace with actual API call
        setDecisions([
            {
                id: '1',
                title: 'Community Budget Allocation 2026',
                description: 'Vote on how to allocate $50,000 for community projects',
                status: 'active',
                endDate: '2026-01-20',
                isVerified: true,
                participantCount: 234,
            },
            {
                id: '2',
                title: 'New Park Location Selection',
                description: 'Choose the location for our next community park',
                status: 'active',
                endDate: '2026-01-18',
                isVerified: true,
                participantCount: 156,
            },
            {
                id: '3',
                title: 'Event Schedule Approval',
                description: 'Approve the proposed schedule for upcoming events',
                status: 'closed',
                endDate: '2026-01-10',
                isVerified: true,
                participantCount: 89,
            },
        ]);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadDecisions();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const currentY = e.touches[0].clientY;
        const distance = currentY - startY;
        if (distance > 0 && window.scrollY === 0) {
            setPullDistance(Math.min(distance, 100));
        }
    };

    const handleTouchEnd = () => {
        if (pullDistance > 60) {
            handleRefresh();
        }
        setPullDistance(0);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 app-layout">
            {/* Header */}
            <div className="bg-white border-b border-[#E2E8F0] sticky top-0 z-10">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-[#0F172A]">Active Decisions</h1>
                            <p className="text-sm text-[#64748B]">
                                {decisions.filter(d => d.status === 'active').length} open votes
                            </p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors"
                            aria-label="Refresh"
                        >
                            <RefreshCw
                                className={`w-5 h-5 text-[#4F46E5] ${isRefreshing ? 'animate-spin' : ''}`}
                            />
                        </button>
                    </div>
                </div>

                {/* Pull-to-refresh indicator */}
                {pullDistance > 0 && (
                    <div className="flex justify-center pb-2">
                        <div
                            className="w-8 h-8 border-2 border-[#4F46E5] border-t-transparent rounded-full transition-transform"
                            style={{ transform: `rotate(${pullDistance * 3.6}deg)` }}
                        />
                    </div>
                )}
            </div>

            {/* Decision List */}
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="px-4 py-4 space-y-3"
            >
                {decisions.map((decision, index) => (
                    <motion.div
                        key={decision.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <button
                            onClick={() => window.location.href = `/vote/${decision.id}`}
                            className="w-full bg-white rounded-2xl p-5 shadow-sm border border-[#E2E8F0] hover:shadow-md transition-all active:scale-[0.98] text-left"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-[#0F172A] mb-1 leading-tight">
                                        {decision.title}
                                    </h3>
                                    <p className="text-sm text-[#64748B] line-clamp-2">
                                        {decision.description}
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-[#94A3B8] flex-shrink-0 ml-2" />
                            </div>

                            {/* Meta Info */}
                            <div className="flex items-center gap-3 flex-wrap">
                                {decision.isVerified && (
                                    <Badge className="bg-[#4F46E5]/5 text-[#4F46E5] border-[#4F46E5]/10 text-xs">
                                        ✓ Verified
                                    </Badge>
                                )}
                                <span
                                    className={`text-xs px-2 py-1 rounded-full ${decision.status === 'active'
                                            ? 'bg-green-50 text-green-600'
                                            : 'bg-[#F1F5F9] text-[#64748B]'
                                        }`}
                                >
                                    {decision.status === 'active' ? 'Open' : 'Closed'}
                                </span>
                                <span className="text-xs text-[#64748B]">
                                    {decision.participantCount} votes
                                </span>
                                <span className="text-xs text-[#64748B]">
                                    Ends {new Date(decision.endDate).toLocaleDateString()}
                                </span>
                            </div>
                        </button>
                    </motion.div>
                ))}

                {/* Empty State */}
                {decisions.length === 0 && !isRefreshing && (
                    <div className="text-center py-16">
                        <Vote className="w-16 h-16 text-[#CBD5E1] mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-[#334155] mb-2">
                            No active decisions
                        </h3>
                        <p className="text-sm text-[#64748B]">
                            Check back later for new voting opportunities
                        </p>
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] safe-area-bottom">
                <div className="flex items-center justify-around px-6 py-3">
                    <button
                        onClick={() => setActiveTab('home')}
                        className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all ${activeTab === 'home'
                                ? 'text-[#4F46E5]'
                                : 'text-[#94A3B8] hover:text-[#4F46E5]'
                            }`}
                    >
                        <Home
                            className={`w-6 h-6 ${activeTab === 'home' ? 'fill-[#4F46E5]' : ''}`}
                            strokeWidth={activeTab === 'home' ? 0 : 2}
                        />
                        <span className="text-xs font-medium">Home</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('votes')}
                        className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all ${activeTab === 'votes'
                                ? 'text-[#4F46E5]'
                                : 'text-[#94A3B8] hover:text-[#4F46E5]'
                            }`}
                    >
                        <Vote
                            className={`w-6 h-6 ${activeTab === 'votes' ? 'fill-[#4F46E5]' : ''}`}
                            strokeWidth={activeTab === 'votes' ? 0 : 2}
                        />
                        <span className="text-xs font-medium">My Votes</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all ${activeTab === 'profile'
                                ? 'text-[#4F46E5]'
                                : 'text-[#94A3B8] hover:text-[#4F46E5]'
                            }`}
                    >
                        <User
                            className={`w-6 h-6 ${activeTab === 'profile' ? 'fill-[#4F46E5]' : ''}`}
                            strokeWidth={activeTab === 'profile' ? 0 : 2}
                        />
                        <span className="text-xs font-medium">Profile</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
