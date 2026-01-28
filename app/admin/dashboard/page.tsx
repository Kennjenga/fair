'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Badge, LoadingSpinner } from '@/components/ui';
import { Sidebar } from '@/components/layouts';
import type { DecisionSummary } from '@/types/participation';
import { 
  TrendingUp, 
  Shield, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Edit2,
  Trash2,
  Copy,
  MoreVertical,
  BarChart3,
  Eye,
  Settings,
  ExternalLink
} from 'lucide-react';

interface IntegrityMetrics {
  decisionsInitiated: number;
  decisionsInitiatedVerifiable: number;
  decisionsParticipatedIn: number;
  decisionsParticipatedInVerifiable: number;
  pendingCommitments: number;
}

/**
 * Main Dashboard - Personal Integrity Ledger
 * 
 * PURPOSE: A personal integrity ledger with scoped entry points into decision governance.
 * The dashboard exposes responsibility without performing control.
 * 
 * Visibility lives here. Authority lives inside the decision.
 */
export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [decisions, setDecisions] = useState<{ created: DecisionSummary[]; participated: DecisionSummary[] }>({ 
    created: [], 
    participated: [] 
  });
  const [integrityMetrics, setIntegrityMetrics] = useState<IntegrityMetrics>({
    decisionsInitiated: 0,
    decisionsInitiatedVerifiable: 0,
    decisionsParticipatedIn: 0,
    decisionsParticipatedInVerifiable: 0,
    pendingCommitments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

    // Fetch dashboard data
    fetchDecisions(token);
  }, [router]);

  const fetchDecisions = async (token: string, showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      console.log('[Dashboard] Fetching decisions...');
      const response = await fetch('/api/v1/admin/dashboard/decisions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Dashboard] Failed to fetch decisions:', response.status, errorData);
        // Set empty data on error
        setDecisions({ created: [], participated: [] });
        setIntegrityMetrics({
          decisionsInitiated: 0,
          decisionsInitiatedVerifiable: 0,
          decisionsParticipatedIn: 0,
          decisionsParticipatedInVerifiable: 0,
          pendingCommitments: 0,
        });
        return;
      }

      const data = await response.json();
      console.log('[Dashboard] Received data:', {
        createdCount: data.decisionsCreated?.length || 0,
        participatedCount: data.decisionsParticipated?.length || 0,
        metrics: data.integrityMetrics,
      });
      
      setDecisions({
        created: data.decisionsCreated || [],
        participated: data.decisionsParticipated || [],
      });
      setIntegrityMetrics(data.integrityMetrics || {
        decisionsInitiated: 0,
        decisionsInitiatedVerifiable: 0,
        decisionsParticipatedIn: 0,
        decisionsParticipatedInVerifiable: 0,
        pendingCommitments: 0,
      });
    } catch (error) {
      console.error('[Dashboard] Error fetching decisions:', error);
      // Set empty data on error
      setDecisions({ created: [], participated: [] });
      setIntegrityMetrics({
        decisionsInitiated: 0,
        decisionsInitiatedVerifiable: 0,
        decisionsParticipatedIn: 0,
        decisionsParticipatedInVerifiable: 0,
        pendingCommitments: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchDecisions(token, true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#F1F5F9] flex">
      {/* Sidebar - Always visible, constant */}
      <Sidebar user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main content - Only this area shows loading */}
      <main className="flex-1 p-6 md:p-8 overflow-auto ml-0 md:ml-0">
        <div className="max-w-7xl mx-auto">
          {/* Header with refresh */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#0F172A] to-[#334155] bg-clip-text text-transparent mb-2">
                Dashboard
              </h1>
              <p className="text-[#64748B] text-lg">
                Personal integrity ledger with scoped entry points into decision governance
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-2"
            >
              {refreshing ? (
                <>
                  <LoadingSpinner size="sm" variant="inline" />
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <TrendingUp size={16} />
                  <span>Refresh</span>
                </>
              )}
            </Button>
          </div>

          {/* Loading State - Only for content area */}
          {loading ? (
            <div className="space-y-6">
              <DashboardLoadingSkeleton />
              <DashboardLoadingSkeleton />
              <DashboardLoadingSkeleton />
            </div>
          ) : (
            <>
              {/* 🛡 INTEGRITY OVERVIEW - Compact Design */}
              <div className="mb-6">
                <Card className="bg-gradient-to-br from-white via-white to-[#F8FAFC] border border-[#E2E8F0] shadow-sm">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#6366F1]">
                        <Shield className="text-white" size={18} />
                      </div>
                      <h2 className="text-lg font-bold text-[#0F172A]">Integrity Overview</h2>
                    </div>
                    
                    {/* Compact Metrics Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <p className="text-xs text-[#64748B] mb-1">Initiated</p>
                        <p className="text-xl font-bold text-[#4F46E5]">{integrityMetrics.decisionsInitiated}</p>
                        <p className="text-xs text-[#64748B]">{integrityMetrics.decisionsInitiatedVerifiable} verified</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-[#64748B] mb-1">Participated</p>
                        <p className="text-xl font-bold text-[#10B981]">{integrityMetrics.decisionsParticipatedIn}</p>
                        <p className="text-xs text-[#64748B]">{integrityMetrics.decisionsParticipatedInVerifiable} verified</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-[#64748B] mb-1">Pending</p>
                        <p className="text-xl font-bold text-[#F59E0B]">{integrityMetrics.pendingCommitments}</p>
                        <p className="text-xs text-[#64748B]">awaiting</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Decisions Tabs */}
              <div className="mb-12">
                <DecisionTabs 
                  decisions={decisions}
                  admin={admin}
                  onRefresh={handleRefresh}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Metric Card Component for Dashboard
 */
function MetricCard({ 
  icon, 
  label, 
  value, 
  subValue, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  subValue: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-[#F8FAFC] to-white">
          {icon}
        </div>
        <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide">{label}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <p className={`text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
          {value}
        </p>
      </div>
      <p className="text-xs text-[#64748B] mt-2">{subValue}</p>
    </div>
  );
}

/**
 * Loading Skeleton Component for Dashboard
 */
function DashboardLoadingSkeleton() {
  return (
    <Card>
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-[#E2E8F0] rounded w-1/3"></div>
        <div className="h-4 bg-[#E2E8F0] rounded w-2/3"></div>
        <div className="h-4 bg-[#E2E8F0] rounded w-1/2"></div>
      </div>
    </Card>
  );
}

/**
 * Decision Tabs Component
 * 
 * Shows My Decisions and Decisions I Participated In in tabs
 */
function DecisionTabs({ 
  decisions, 
  admin,
  onRefresh
}: { 
  decisions: { created: DecisionSummary[]; participated: DecisionSummary[] };
  admin: { adminId: string; email: string; role: string } | null;
  onRefresh: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'my-decisions' | 'participated'>('my-decisions');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'live' | 'closed' | 'finalized'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Get unique categories from created decisions
  const uniqueCategories = Array.from(
    new Set(decisions.created.map(d => d.category || 'Custom').filter(Boolean))
  ).sort();

  // Filter decisions based on search, status, and category (for my-decisions only)
  const filteredCreated = decisions.created.filter(decision => {
    const matchesSearch = decision.hackathonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         decision.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || decision.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || (decision.category || 'Custom') === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const filteredParticipated = decisions.participated.filter(decision => {
    const matchesSearch = decision.hackathonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         decision.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || decision.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Enhanced Tab Headers */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-2 mb-6 flex items-center gap-2">
        <button
          onClick={() => {
            setActiveTab('my-decisions');
            setCategoryFilter('all'); // Reset category filter when switching tabs
          }}
          className={`flex-1 px-6 py-3 font-semibold text-sm rounded-lg transition-all ${
            activeTab === 'my-decisions'
              ? 'bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white shadow-md'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Settings size={16} />
            <span>My Decisions</span>
            {decisions.created.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'my-decisions'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#EEF2FF] text-[#4F46E5]'
              }`}>
                {decisions.created.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab('participated');
            setCategoryFilter('all'); // Reset category filter when switching tabs
          }}
          className={`flex-1 px-6 py-3 font-semibold text-sm rounded-lg transition-all ${
            activeTab === 'participated'
              ? 'bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white shadow-md'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Users size={16} />
            <span>Participated In</span>
            {decisions.participated.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'participated'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#EEF2FF] text-[#4F46E5]'
              }`}>
                {decisions.participated.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search decisions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
          />
          <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B]" size={18} />
        </div>
        
        {/* Filter Row */}
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent bg-white text-sm min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="live">Live</option>
            <option value="closed">Closed</option>
            <option value="finalized">Finalized</option>
          </select>
          
          {/* Category Filter - Only show for My Decisions tab */}
          {activeTab === 'my-decisions' && uniqueCategories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent bg-white text-sm min-w-[180px]"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'my-decisions' ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-[#64748B] text-sm">
              Decisions you created or are assigned as a manager. This section acknowledges responsibility — not power.
            </p>
            <Link href="/admin/hackathons/create">
              <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] flex items-center gap-2">
                <TrendingUp size={16} />
                Create Decision
              </Button>
            </Link>
          </div>
          {filteredCreated.length === 0 ? (
            <Card className="text-center py-16 bg-gradient-to-br from-white to-[#F8FAFC]">
              <div className="max-w-md mx-auto">
                <div className="p-4 rounded-full bg-[#EEF2FF] w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Settings className="text-[#4F46E5]" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2">
                  {decisions.created.length === 0 ? 'No decisions created yet' : 'No decisions match your filters'}
                </h3>
                <p className="text-[#64748B] mb-6">
                  {decisions.created.length === 0 
                    ? 'Get started by creating your first decision governance process.'
                    : 'Try adjusting your search or filter criteria.'}
                </p>
                {decisions.created.length === 0 && (
                  <Link href="/admin/hackathons/create">
                    <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1]">
                      Create Your First Decision
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredCreated.map((decision) => (
                <DecisionCard
                  key={decision.hackathonId}
                  decision={decision}
                  isOwner={true}
                  admin={admin}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="text-[#64748B] text-sm mb-6">
            Read-only by design. Participation implies legitimacy, not authority.
          </p>
          {filteredParticipated.length === 0 ? (
            <Card className="text-center py-16 bg-gradient-to-br from-white to-[#F8FAFC]">
              <div className="max-w-md mx-auto">
                <div className="p-4 rounded-full bg-[#DCFCE7] w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="text-[#10B981]" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2">
                  {decisions.participated.length === 0 ? 'No participation records yet' : 'No decisions match your filters'}
                </h3>
                <p className="text-[#64748B]">
                  {decisions.participated.length === 0 
                    ? 'You haven\'t participated in any decisions yet.'
                    : 'Try adjusting your search or filter criteria.'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredParticipated.map((decision) => (
                <DecisionCard
                  key={decision.hackathonId}
                  decision={decision}
                  isOwner={false}
                  admin={admin}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Decision Card Component
 * 
 * Enhanced decision card with management capabilities for owners
 */
function DecisionCard({ 
  decision, 
  isOwner,
  admin,
  onRefresh
}: { 
  decision: DecisionSummary; 
  isOwner: boolean;
  admin: { adminId: string; email: string; role: string } | null;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const getStatusBadge = (status: string, integrityStatus: string) => {
    // Show "Verified" if finalized and verifiable
    if (status === 'finalized' && integrityStatus === 'verifiable') {
      return <Badge variant="success" className="text-xs">✓ Verified</Badge>;
    }
    
    const statusMap: Record<string, { label: string; variant: 'primary' | 'success' | 'warning' | 'secondary' }> = {
      'draft': { label: 'Draft', variant: 'warning' },
      'live': { label: 'Live', variant: 'success' },
      'closed': { label: 'Closed', variant: 'secondary' },
      'finalized': { label: 'Finalized', variant: 'secondary' },
      'verified': { label: 'Verified', variant: 'success' },
    };
    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>;
  };

  const getIntegrityStateBadge = (state: 'anchored' | 'pending') => {
    if (state === 'anchored') {
      return (
        <Badge variant="success" className="text-xs flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
          Anchored
        </Badge>
      );
    }
    return (
      <Badge variant="warning" className="text-xs flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
        Pending
      </Badge>
    );
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${decision.hackathonName}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/v1/admin/hackathons/${decision.hackathonId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        onRefresh();
      } else {
        const error = await response.json();
        alert(`Failed to delete: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete decision');
    } finally {
      setDeleting(false);
      setShowMenu(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const token = localStorage.getItem('auth_token');
      // First get the hackathon data
      const getResponse = await fetch(`/api/v1/admin/hackathons/${decision.hackathonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!getResponse.ok) {
        throw new Error('Failed to fetch decision data');
      }

      const { hackathon } = await getResponse.json();
      
      // Create a new hackathon with similar data
      const createResponse = await fetch('/api/v1/admin/hackathons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `${hackathon.name} (Copy)`,
          description: hackathon.description,
          startDate: hackathon.start_date,
          endDate: hackathon.end_date,
          templateId: hackathon.template_id,
        }),
      });

      if (createResponse.ok) {
        const { hackathon: newHackathon } = await createResponse.json();
        router.push(`/admin/hackathons/${newHackathon.hackathon_id}`);
      } else {
        const error = await createResponse.json();
        alert(`Failed to duplicate: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Duplicate error:', error);
      alert('Failed to duplicate decision');
    } finally {
      setDuplicating(false);
      setShowMenu(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border border-[#E2E8F0] hover:border-[#4F46E5]/30 group">
      <div className="p-6">
        {/* Header with Menu */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-[#0F172A] mb-2 truncate group-hover:text-[#4F46E5] transition-colors">
              {decision.hackathonName}
            </h3>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge className="bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 text-[#4F46E5] border-[#4F46E5]/20 text-xs">
                {decision.category || 'Custom'}
              </Badge>
              {decision.decisionType && (
                <Badge variant="secondary" className="text-xs">
                  {decision.decisionType}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Management Menu for Owners */}
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors"
              >
                <MoreVertical size={18} className="text-[#64748B]" />
              </button>
              
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-10 z-20 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-2 min-w-[180px]">
                    <Link 
                      href={`/admin/hackathons/${decision.hackathonId}`}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-[#F8FAFC] text-sm text-[#334155]"
                      onClick={() => setShowMenu(false)}
                    >
                      <Edit2 size={16} />
                      <span>Edit</span>
                    </Link>
                    <Link 
                      href={`/admin/hackathons/${decision.hackathonId}`}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-[#F8FAFC] text-sm text-[#334155]"
                      onClick={() => setShowMenu(false)}
                    >
                      <BarChart3 size={16} />
                      <span>Analytics</span>
                    </Link>
                    <button
                      onClick={handleDuplicate}
                      disabled={duplicating}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F8FAFC] text-sm text-[#334155] disabled:opacity-50"
                    >
                      <Copy size={16} />
                      <span>{duplicating ? 'Duplicating...' : 'Duplicate'}</span>
                    </button>
                    <div className="border-t border-[#E2E8F0] my-1" />
                    <button
                      onClick={handleDelete}
                      disabled={deleting || decision.status === 'live' || decision.status === 'finalized'}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#FEE2E2] text-sm text-[#DC2626] disabled:opacity-50"
                      title={decision.status === 'live' || decision.status === 'finalized' ? 'Cannot delete live or finalized decisions' : ''}
                    >
                      <Trash2 size={16} />
                      <span>{deleting ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {decision.description && (
          <p className="text-sm text-[#64748B] mb-4 line-clamp-2">{decision.description}</p>
        )}

        {/* Status and Info */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {getStatusBadge(decision.status, decision.integrityStatus)}
          {getIntegrityStateBadge(decision.integrityState)}
          <div className="flex items-center gap-1 text-xs text-[#64748B]">
            <Users size={14} />
            <span>{decision.participationCount}</span>
          </div>
          {decision.lockedRules && decision.lockedRules.length > 0 && (
            <Badge variant="warning" className="text-xs">
              🔒 Locked
            </Badge>
          )}
        </div>

        {/* Dates */}
        {(decision.startDate || decision.endDate) && (
          <div className="mb-4 text-xs text-[#64748B] space-y-1">
            {decision.startDate && (
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>Start: {formatDate(decision.startDate)}</span>
              </div>
            )}
            {decision.endDate && (
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>End: {formatDate(decision.endDate)}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-[#E2E8F0]">
          <Link href={`/admin/hackathons/${decision.hackathonId}`} className="flex-1">
            <Button variant="primary" size="sm" className="w-full">
              <Eye size={14} className="mr-1" />
              View
            </Button>
          </Link>

          {isOwner && decision.canManage && (
            <Link href={`/admin/hackathons/${decision.hackathonId}`}>
              <Button variant="secondary" size="sm" className="flex items-center gap-1">
                <Settings size={14} />
                Manage
              </Button>
            </Link>
          )}

          <Link href={`/admin/hackathons/${decision.hackathonId}/integrity`}>
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <Shield size={14} />
              Verify
            </Button>
          </Link>
        </div>

        {/* Participant View - Additional Info */}
        {!isOwner && (
          <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#64748B]">
                <span>Role:</span>
                <Badge variant="info" className="text-xs capitalize">
                  {decision.role}
                </Badge>
              </div>
              {decision.outcomeState && (
                <Badge variant="success" className="text-xs">
                  {decision.outcomeState === 'verified' ? '✓ Verified' : 'Published'}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
