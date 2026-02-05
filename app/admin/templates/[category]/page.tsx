'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components/ui';
import { Sidebar } from '@/components/layouts';
import { Search, Filter, ChevronRight, Shield, Users, Award, Zap, Clock, Building2, Network, ArrowLeft } from 'lucide-react';

/**
 * Hackathon template interface matching the PRD structure
 */
interface HackathonTemplate {
  templateId: string;
  name: string;
  description: string;
  governanceModel: string;
  intendedUse: string;
  complexityLevel: 'beginner' | 'intermediate' | 'advanced';
  config: {
    roles: Array<{ name: string; description: string }>;
    evaluationLogic: {
      method: string;
      votingPermissions?: string;
    };
    integrityRules: {
      immutableAfterLaunch: boolean;
      publicAuditLog: boolean;
    };
    outcomeLogic: {
      calculationMethod: string;
    };
  };
}

/**
 * Template details matching PRD structure
 */
interface TemplateDetails {
  intent: string;
  bestFit: string[];
  decisionAuthority: string;
  fairEnforced: string[];
  organizerExpectations: string[];
  participantExpectations: string[];
  outcomeGuarantees: string[];
}

/**
 * PRD-aligned template details
 */
const templateDetails: Record<string, TemplateDetails> = {
  centralized: {
    intent: 'Preserve traditional organizer- and judge-led hackathons while removing the need for blind trust. This template assumes centralized authority, but enforces decentralized integrity.',
    bestFit: ['Corporate hackathons', 'University demo days', 'Accelerators & incubators', 'Internal innovation challenges'],
    decisionAuthority: 'Judges evaluate submissions. Organizers configure criteria. No community voting influence.',
    fairEnforced: [
      'Judge scores are immutable once submitted',
      'Submission timestamps are locked',
      'Evaluation criteria are fixed before judging begins',
      'Final rankings are mathematically derived from locked scores',
      'All scoring actions are auditable'
    ],
    organizerExpectations: [
      'Define judging criteria clearly upfront',
      'Assign judges before evaluations begin',
      'Cannot override or edit scores after submission',
      'Cannot modify ranking logic mid-process'
    ],
    participantExpectations: [
      'Submissions will not be altered',
      'Judges cannot retroactively change scores',
      'Rankings reflect actual evaluations',
      'Disputes can be resolved with proof, not arguments'
    ],
    outcomeGuarantees: [
      'Winner list is verifiable',
      'Score history is preserved',
      'Any tampering attempt is detectable',
      'Organizer credibility is protected by evidence'
    ]
  },
  community_led: {
    intent: 'Enable community-driven outcomes without vote manipulation, brigading, or opacity. This template prioritizes participatory legitimacy.',
    bestFit: ['Student hackathons', 'Open-source communities', 'Public innovation challenges', 'Grassroots tech events'],
    decisionAuthority: 'Community members vote. Optional eligibility constraints. No privileged evaluator role.',
    fairEnforced: [
      'One-participant-one-vote enforcement',
      'Vote uniqueness guarantees',
      'Transparent tally logic',
      'Time-bound voting windows',
      'Immutable final vote counts'
    ],
    organizerExpectations: [
      'Define voter eligibility rules',
      'Decide visibility (public vs private results)',
      'Accept community outcome as final'
    ],
    participantExpectations: [
      'Votes are counted exactly once',
      'No hidden weighting or admin overrides',
      'Final results reflect real participation',
      'Process fairness does not depend on trust'
    ],
    outcomeGuarantees: [
      'No duplicate or fake votes',
      'Vote totals are independently verifiable',
      'Community legitimacy is defensible'
    ]
  },
  sponsor_driven: {
    intent: 'Allow sponsors to participate without compromising fairness or influencing unrelated outcomes. This template explicitly assumes conflicts of interest and neutralizes them structurally.',
    bestFit: ['Multi-sponsor hackathons', 'Ecosystem or platform launches', 'API-focused events', 'Corporate partnerships'],
    decisionAuthority: 'Sponsor judges evaluate only their tracks. Tracks are isolated. No cross-track score influence.',
    fairEnforced: [
      'Track separation is enforced',
      'Sponsor criteria are locked per track',
      'Judges are scoped to assigned tracks only',
      'Results from one track cannot affect another'
    ],
    organizerExpectations: [
      'Define sponsor tracks clearly',
      'Assign judges correctly',
      'Accept isolation constraints'
    ],
    participantExpectations: [
      'Sponsors cannot influence unrelated submissions',
      'Criteria will not change after launch',
      'Evaluation rules are consistent within tracks'
    ],
    outcomeGuarantees: [
      'Conflict-of-interest mitigation is provable',
      'Sponsor influence is transparent and bounded',
      'Credibility with both sponsors and participants'
    ]
  },
  dao_managed: {
    intent: 'Run hackathons as on-chain-aligned governance processes, without sacrificing usability. This template treats the hackathon as a collective decision system, not an event.',
    bestFit: ['DAO ecosystems', 'Protocol grant programs', 'Web3 communities', 'Token-governed collectives'],
    decisionAuthority: 'Proposal-based submissions. Token-weighted or role-based voting. On-chain finality of outcomes.',
    fairEnforced: [
      'Vote execution correctness',
      'Quorum and threshold enforcement',
      'Immutable governance rules',
      'Outcome finality once committed'
    ],
    organizerExpectations: [
      'Define governance parameters carefully',
      'Accept automated execution of outcomes',
      'No post-hoc discretion'
    ],
    participantExpectations: [
      'Votes are executed as defined',
      'Outcomes cannot be reversed socially',
      'Governance rules are honored exactly'
    ],
    outcomeGuarantees: [
      'Treasury actions are tied to valid decisions',
      'Governance legitimacy is enforceable',
      'DAO processes are auditable and defensible'
    ]
  },
  hybrid: {
    intent: 'Balance multiple sources of authority without ambiguity or power drift. This template assumes shared legitimacy, enforced by math and rules.',
    bestFit: ['Universities + sponsors', 'Accelerators + community voting', 'Public–private partnerships'],
    decisionAuthority: 'Judges, sponsors, and community all contribute. Each role has predefined weighting. Aggregated final score.',
    fairEnforced: [
      'Weighting logic is locked before launch',
      'Role-based permissions enforced',
      'Aggregation formula is transparent',
      'No role can exceed assigned influence'
    ],
    organizerExpectations: [
      'Define weighting responsibly',
      'Assign roles accurately',
      'Accept outcome as computed'
    ],
    participantExpectations: [
      'Influence is known upfront',
      'No hidden rebalancing',
      'Final ranking matches published rules'
    ],
    outcomeGuarantees: [
      'Stakeholder influence is provable',
      'Outcome legitimacy is defensible',
      'Complex governance without chaos'
    ]
  },
  rolling: {
    intent: 'Ensure fairness over time, not just at a single deadline. This template treats decisions as ongoing processes, not events.',
    bestFit: ['Continuous grant programs', 'Long-term innovation funds', 'Rolling demo submissions'],
    decisionAuthority: 'Evaluations occur in defined windows. Rules persist across time. Historical decisions remain visible.',
    fairEnforced: [
      'Evaluation consistency across windows',
      'Reviewer accountability over time',
      'Immutable historical records',
      'Comparable outcomes across cohorts'
    ],
    organizerExpectations: [
      'Maintain consistent criteria',
      'Respect historical integrity',
      'Avoid favoritism drift'
    ],
    participantExpectations: [
      'Equal treatment regardless of submission time',
      'No silent rule changes',
      'Past decisions remain auditable'
    ],
    outcomeGuarantees: [
      'Long-term fairness is provable',
      'Institutional memory is preserved',
      'Trust compounds over time'
    ]
  },
  pilot: {
    intent: 'Demonstrate FAIR\'s integrity guarantees in the open. This template exists to prove, not promise.',
    bestFit: ['First-time FAIR users', 'Institutional pilots', 'Public demos and showcases'],
    decisionAuthority: 'Simple evaluation logic. Maximum transparency. Public auditability.',
    fairEnforced: [
      'End-to-end visibility',
      'Public audit logs',
      'Verifiable decision lifecycle',
      'Immutable outcome proofs'
    ],
    organizerExpectations: [
      'Accept transparency',
      'Allow scrutiny',
      'Use as learning + validation'
    ],
    participantExpectations: [
      'Observe full decision flow',
      'Verify claims independently',
      'Trust based on evidence'
    ],
    outcomeGuarantees: [
      'FAIR works as described',
      'No hidden manipulation',
      'Integrity survives real use'
    ]
  }
};

const governanceModelIcons: Record<string, any> = {
  centralized: Building2,
  community_led: Users,
  sponsor_driven: Award,
  dao_managed: Network,
  hybrid: Zap,
  rolling: Clock,
  pilot: Shield,
};

const complexityColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800 border-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  advanced: 'bg-red-100 text-red-800 border-red-200',
};

const categoryLabels: Record<string, string> = {
  'competitions-hackathons': 'Competitions & Hackathons',
  'community-decisions': 'Community Decisions',
  'governance-formal': 'Governance & Formal Decisions',
  'grants-funding-rewards': 'Grants, Funding & Rewards',
  'education-evaluation': 'Education & Evaluation',
  'hiring-talent': 'Hiring & Talent',
  'programs-ecosystems': 'Programs & Ecosystems',
  'integrity-sensitive': 'Integrity-Sensitive Processes',
  'custom-advanced': 'Custom & Advanced',
};

/**
 * Category-specific templates page
 * Shows hackathon templates for competitions-hackathons, coming soon for others
 */
export default function CategoryTemplatesPage() {
  const router = useRouter();
  const params = useParams();
  const category = params?.category as string;
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [templates, setTemplates] = useState<HackathonTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }

    const parsed = JSON.parse(adminData);
    setAdmin(parsed);

    if (category === 'competitions-hackathons') {
      fetchTemplates(token);
    } else {
      setLoading(false);
    }
  }, [router, category]);

  const fetchTemplates = async (token: string) => {
    try {
      setError(null);
      const response = await fetch('/api/v1/admin/templates?filter=built-in', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch templates: ${response.status}`);
      }

      const data = await response.json();
      const fetchedTemplates = data.templates || [];
      if (fetchedTemplates.length === 0) setError(null);
      setTemplates(fetchedTemplates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  /** Load default built-in templates (Centralized, Community-Led, etc.) then refetch list */
  const handleLoadDefaultTemplates = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    setSeeding(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/templates/seed', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load templates');
      }
      await fetchTemplates(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load default templates');
    } finally {
      setSeeding(false);
    }
  };

  const getComplexityBadgeColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Filter templates by search
  const filteredTemplates = templates.filter(template => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.governanceModel.toLowerCase().includes(query) ||
      (template.intendedUse && template.intendedUse.toLowerCase().includes(query))
    );
  });

  // Show coming soon for non-hackathon categories
  if (category !== 'competitions-hackathons') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex">
        <Sidebar user={admin || undefined} />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#4F46E5] mb-6">
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
            
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#4F46E5]/10 to-[#6366F1]/10 mb-6">
                <Clock className="w-10 h-10 text-[#4F46E5]" />
              </div>
              
              <Badge className="mb-4 bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 text-[#4F46E5] border-[#4F46E5]/20">
                Coming Soon
              </Badge>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Templates for {categoryLabels[category] || category} are on the way
              </h1>
              
              <p className="text-lg text-[#64748B] max-w-2xl mx-auto mb-8">
                We're actively developing templates for this decision category. 
                Check back soon, or explore our available hackathon templates to get started.
              </p>
            </div>

            <Card className="p-8 mb-8 border border-[#E2E8F0]">
              <h2 className="text-xl font-semibold mb-4 text-[#0F172A]">What's Next?</h2>
              <ul className="space-y-3 text-[#64748B]">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#4F46E5] mt-2 flex-shrink-0" />
                  <span>We're designing governance models specific to this decision category</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#4F46E5] mt-2 flex-shrink-0" />
                  <span>Each template will include integrity guarantees and outcome verification</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#4F46E5] mt-2 flex-shrink-0" />
                  <span>Templates will be pre-committed governance models, just like our hackathon templates</span>
                </li>
              </ul>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/admin/templates/competitions-hackathons">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-[#4F46E5] to-[#6366F1]">
                  Browse Hackathon Templates
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex">
        <Sidebar user={admin || undefined} />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-[#334155]">Loading templates...</div>
        </main>
      </div>
    );
  }

  // Show error or empty state (no templates yet — offer one-click load of default templates)
  if (error || templates.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex">
        <Sidebar user={admin || undefined} />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#4F46E5] mb-6">
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <div className="bg-white rounded-lg border border-[#E2E8F0] p-8 shadow-sm">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#EEF2FF] mb-4">
                  <Shield className="w-8 h-8 text-[#4F46E5]" />
                </div>
                <h2 className="text-2xl font-bold text-[#0F172A] mb-2">No templates yet</h2>
                <p className="text-[#64748B] mb-6">
                  {error
                    ? error
                    : 'Load the default hackathon templates (Centralized, Community-Led, Sponsor-Driven, DAO-Managed, Hybrid, Rolling, Pilot) to get started.'}
                </p>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-[#0F172A] mb-2">Available templates after loading</h3>
                <p className="text-sm text-[#64748B] mb-4">
                  Centralized (Organizer-Led), Community-Led, Sponsor-Driven, DAO-Managed, Hybrid, Rolling, Pilot.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button
                    onClick={handleLoadDefaultTemplates}
                    disabled={seeding}
                    className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1]"
                  >
                    {seeding ? 'Loading templates...' : 'Load default templates'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setLoading(true);
                      setError(null);
                      const token = localStorage.getItem('auth_token');
                      if (token) fetchTemplates(token);
                    }}
                    disabled={seeding}
                  >
                    Retry
                  </Button>
                  <Link href="/admin/dashboard">
                    <Button variant="secondary">Back to Dashboard</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar user={admin || undefined} />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#4F46E5] mb-4">
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
            <Badge className="mb-4 bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 text-[#4F46E5] border-[#4F46E5]/20">
              FAIR Hackathon Templates
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Pre-committed governance models for fair hackathons
            </h1>
            <p className="text-[#64748B] max-w-3xl mb-4">
              Each template is a pre-committed governance model. Selecting a template is equivalent to accepting a decision constitution for that hackathon.
            </p>
            <div className="bg-gradient-to-r from-[#4F46E5]/5 to-[#6366F1]/5 border border-[#4F46E5]/20 rounded-xl p-4 max-w-3xl">
              <p className="text-sm font-semibold text-[#4F46E5] mb-1">🧠 Final Unifying Principle</p>
              <p className="text-sm text-[#64748B]">
                Templates don't standardize hackathons. They standardize fairness. Each template sets expectations before participation, removes ambiguity before disputes, and produces legitimacy after outcomes.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] w-5 h-5" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            </div>
          </div>

          {/* Templates grid */}
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {filteredTemplates.map((template) => {
              const details = templateDetails[template.governanceModel];
              const isSelected = selectedTemplate === template.templateId;
              const Icon = governanceModelIcons[template.governanceModel] || Shield;

              return (
                <Card
                  key={template.templateId}
                  className={`border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#4F46E5] shadow-lg'
                      : 'border-[#E2E8F0] hover:shadow-md'
                  }`}
                  onClick={() => setSelectedTemplate(isSelected ? null : template.templateId)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4F46E5]/10 to-[#6366F1]/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-[#4F46E5]" />
                        </div>
                        <h2 className="text-xl font-semibold pr-2">{template.name}</h2>
                      </div>
                      <Badge className={`text-xs ${getComplexityBadgeColor(template.complexityLevel)}`}>
                        {template.complexityLevel}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#64748B] mb-4">{template.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div>
                        <span className="text-xs font-semibold text-[#64748B]">Best for:</span>
                        <p className="text-xs text-[#94A3B8] mt-1">{template.intendedUse}</p>
                      </div>
                    </div>

                    <Link
                      href={`/admin/hackathons/create?template=${template.templateId}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button className="w-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1]">
                        Use This Template
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </section>

          {/* Detailed view for selected template */}
          {selectedTemplate && (() => {
            const template = filteredTemplates.find(t => t.templateId === selectedTemplate);
            if (!template) return null;
            const details = templateDetails[template.governanceModel];
            if (!details) return null;

            return (
              <section className="mt-8 bg-white rounded-lg border border-[#E2E8F0] p-8 shadow-sm">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{template.name}</h2>
                    <p className="text-[#64748B]">{template.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTemplate(null)}
                    className="ml-4"
                  >
                    Close
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Intent */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-[#0F172A]">Intent</h3>
                    <p className="text-sm text-[#64748B] mb-6">{details.intent}</p>

                    <h3 className="font-semibold text-lg mb-3 text-[#0F172A]">Best Fit</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-[#64748B] mb-6">
                      {details.bestFit.map((fit, idx) => (
                        <li key={idx}>{fit}</li>
                      ))}
                    </ul>

                    <h3 className="font-semibold text-lg mb-3 text-[#0F172A]">Decision Authority Model</h3>
                    <p className="text-sm text-[#64748B]">{details.decisionAuthority}</p>
                  </div>

                  {/* Expectations and Guarantees */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-[#0F172A]">FAIR-Enforced Expectations</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-[#64748B] mb-6">
                      {details.fairEnforced.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>

                    <h3 className="font-semibold text-lg mb-3 text-[#0F172A]">Organizer Expectations</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-[#64748B] mb-6">
                      {details.organizerExpectations.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>

                    <h3 className="font-semibold text-lg mb-3 text-[#0F172A]">Participant Expectations</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-[#64748B] mb-6">
                      {details.participantExpectations.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>

                    <h3 className="font-semibold text-lg mb-3 text-[#0F172A]">Outcome Guarantees</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-[#64748B]">
                      {details.outcomeGuarantees.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
                  <Link href={`/admin/hackathons/create?template=${template.templateId}`}>
                    <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1]">
                      Create Hackathon with This Template
                    </Button>
                  </Link>
                </div>
              </section>
            );
          })()}
        </div>
      </main>
    </div>
  );
}
