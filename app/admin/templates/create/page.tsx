'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Input, Badge } from '@/components/ui';
import { Sidebar } from '@/components/layouts';
import { ArrowLeft, ArrowRight, Check, Settings, Users, Shield, FileText, Eye, Lock, Plus, X } from 'lucide-react';

const sidebarItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { label: 'Decisions', href: '/admin/hackathons/templates', icon: '🎯' },
  { label: 'Hackathons', href: '/admin/hackathons', icon: '🏆' },
  { label: 'Integrity Ledger', href: '/admin/integrity', icon: '🔒' },
  { label: 'Templates', href: '/admin/hackathons/templates', icon: '📋' },
  { label: 'Polls', href: '/admin/polls', icon: '🗳️' },
];

type Step = 'identity' | 'decision' | 'roles' | 'integrity' | 'outcome' | 'preview';

/**
 * Custom Template Builder
 * Implements PRD Section 10: Custom Hackathon Template Builder
 */
export default function CreateTemplatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('identity');
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Template Identity
  const [identity, setIdentity] = useState({
    name: '',
    description: '',
    governanceModel: 'centralized' as const,
    intendedUse: '',
    complexityLevel: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
  });

  // Step 2: Decision Model (Evaluation Logic)
  const [evaluationLogic, setEvaluationLogic] = useState({
    method: 'score' as 'vote' | 'score' | 'rank',
    votingMode: 'single' as 'single' | 'multiple' | 'ranked',
    votingPermissions: 'judges_only' as 'voters_only' | 'judges_only' | 'voters_and_judges',
    voterWeight: 0.5,
    judgeWeight: 0.5,
    rankPointsConfig: { '1': 10, '2': 7, '3': 5 } as Record<string, number>,
  });

  // Step 3: Roles & Permissions
  const [roles, setRoles] = useState<Array<{ name: string; permissions: string[]; description: string }>>([
    { name: 'organizer', permissions: ['create', 'edit', 'view_all'], description: 'Full control over hackathon' },
    { name: 'judge', permissions: ['view_submissions', 'evaluate'], description: 'Evaluates submissions' },
    { name: 'participant', permissions: ['submit', 'view_own_submission'], description: 'Submits projects' },
  ]);

  // Step 4: Integrity Rules
  const [integrityRules, setIntegrityRules] = useState({
    immutableAfterLaunch: true,
    requireCommitments: true,
    publicAuditLog: false,
    allowVoteEditing: false,
    minVoterParticipation: 0,
    minJudgeParticipation: 0,
  });

  // Step 5: Outcome Logic
  const [outcomeLogic, setOutcomeLogic] = useState({
    calculationMethod: 'weighted_average' as 'simple_majority' | 'weighted_average' | 'ranked_choice' | 'custom',
    tieBreakingMethod: 'judge_decision' as 'random' | 'judge_decision' | 'revote',
    quorumRequired: 0,
  });

  // Step 6: Form Fields (optional)
  const [formFields, setFormFields] = useState<Array<{
    fieldName: string;
    fieldType: string;
    fieldLabel: string;
    isRequired: boolean;
    displayOrder: number;
  }>>([]);

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: 'identity', label: 'Template Identity', icon: FileText },
    { id: 'decision', label: 'Decision Model', icon: Settings },
    { id: 'roles', label: 'Roles & Permissions', icon: Users },
    { id: 'integrity', label: 'Integrity Rules', icon: Shield },
    { id: 'outcome', label: 'Outcome Logic', icon: Eye },
    { id: 'preview', label: 'Preview & Lock', icon: Lock },
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 'identity':
        return identity.name.trim().length > 0 && identity.governanceModel.length > 0;
      case 'decision':
        return evaluationLogic.method.length > 0;
      case 'roles':
        return roles.length > 0;
      case 'integrity':
        return true;
      case 'outcome':
        return outcomeLogic.calculationMethod.length > 0;
      case 'preview':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;

    const stepOrder: Step[] = ['identity', 'decision', 'roles', 'integrity', 'outcome', 'preview'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder: Step[] = ['identity', 'decision', 'roles', 'integrity', 'outcome', 'preview'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const addRole = () => {
    setRoles([...roles, { name: '', permissions: [], description: '' }]);
  };

  const removeRole = (index: number) => {
    setRoles(roles.filter((_, i) => i !== index));
  };

  const updateRole = (index: number, field: string, value: any) => {
    const updated = [...roles];
    updated[index] = { ...updated[index], [field]: value };
    setRoles(updated);
  };

  const addPermission = (roleIndex: number, permission: string) => {
    const updated = [...roles];
    if (!updated[roleIndex].permissions.includes(permission)) {
      updated[roleIndex].permissions.push(permission);
    }
    setRoles(updated);
  };

  const removePermission = (roleIndex: number, permissionIndex: number) => {
    const updated = [...roles];
    updated[roleIndex].permissions = updated[roleIndex].permissions.filter((_, i) => i !== permissionIndex);
    setRoles(updated);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const templateConfig = {
        roles,
        permissions: [],
        evaluationLogic,
        integrityRules,
        outcomeLogic,
      };

      const response = await fetch('/api/v1/admin/templates', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: identity.name,
          description: identity.description || undefined,
          governanceModel: identity.governanceModel,
          intendedUse: identity.intendedUse || undefined,
          complexityLevel: identity.complexityLevel,
          config: templateConfig,
          defaultFormFields: formFields,
          isPublic: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create template');
        setLoading(false);
        return;
      }

      // Redirect to template detail page
      router.push(`/admin/hackathons/templates/${data.template.templateId}`);
    } catch (err) {
      console.error('Create template error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'identity':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Template Identity</h2>
              <p className="text-[#64748B]">Define the basic information for your custom template.</p>
            </div>

            <Input
              label="Template Name *"
              id="name"
              type="text"
              value={identity.name}
              onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
              required
              placeholder="e.g., My Custom Hackathon Template"
            />

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[#334155] mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={identity.description}
                onChange={(e) => setIdentity({ ...identity, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
                placeholder="Describe what this template is designed for"
              />
            </div>

            <div>
              <label htmlFor="governanceModel" className="block text-sm font-medium text-[#334155] mb-2">
                Governance Model *
              </label>
              <select
                id="governanceModel"
                value={identity.governanceModel}
                onChange={(e) => setIdentity({ ...identity, governanceModel: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
              >
                <option value="centralized">Centralized</option>
                <option value="community_led">Community-Led</option>
                <option value="sponsor_driven">Sponsor-Driven</option>
                <option value="dao_managed">DAO-Managed</option>
                <option value="hybrid">Hybrid</option>
                <option value="rolling">Rolling</option>
                <option value="pilot">Pilot</option>
              </select>
            </div>

            <div>
              <label htmlFor="intendedUse" className="block text-sm font-medium text-[#334155] mb-2">
                Intended Use
              </label>
              <textarea
                id="intendedUse"
                value={identity.intendedUse}
                onChange={(e) => setIdentity({ ...identity, intendedUse: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
                placeholder="e.g., Corporate hackathons, internal innovation challenges"
              />
            </div>

            <div>
              <label htmlFor="complexityLevel" className="block text-sm font-medium text-[#334155] mb-2">
                Complexity Level *
              </label>
              <select
                id="complexityLevel"
                value={identity.complexityLevel}
                onChange={(e) => setIdentity({ ...identity, complexityLevel: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        );

      case 'decision':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Decision Model</h2>
              <p className="text-[#64748B]">Configure how decisions are made and evaluated.</p>
            </div>

            <div>
              <label htmlFor="method" className="block text-sm font-medium text-[#334155] mb-2">
                Evaluation Method *
              </label>
              <select
                id="method"
                value={evaluationLogic.method}
                onChange={(e) => setEvaluationLogic({ ...evaluationLogic, method: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
              >
                <option value="vote">Vote</option>
                <option value="score">Score</option>
                <option value="rank">Rank</option>
              </select>
            </div>

            {evaluationLogic.method === 'vote' && (
              <>
                <div>
                  <label htmlFor="votingMode" className="block text-sm font-medium text-[#334155] mb-2">
                    Voting Mode
                  </label>
                  <select
                    id="votingMode"
                    value={evaluationLogic.votingMode}
                    onChange={(e) => setEvaluationLogic({ ...evaluationLogic, votingMode: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
                  >
                    <option value="single">Single Choice</option>
                    <option value="multiple">Multiple Choice</option>
                    <option value="ranked">Ranked Choice</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="votingPermissions" className="block text-sm font-medium text-[#334155] mb-2">
                    Voting Permissions
                  </label>
                  <select
                    id="votingPermissions"
                    value={evaluationLogic.votingPermissions}
                    onChange={(e) => setEvaluationLogic({ ...evaluationLogic, votingPermissions: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
                  >
                    <option value="voters_only">Voters Only</option>
                    <option value="judges_only">Judges Only</option>
                    <option value="voters_and_judges">Voters and Judges</option>
                  </select>
                </div>
              </>
            )}

            {(evaluationLogic.method === 'score' || evaluationLogic.method === 'vote') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="voterWeight" className="block text-sm font-medium text-[#334155] mb-2">
                    Voter Weight
                  </label>
                  <input
                    id="voterWeight"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={evaluationLogic.voterWeight}
                    onChange={(e) => setEvaluationLogic({ ...evaluationLogic, voterWeight: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="judgeWeight" className="block text-sm font-medium text-[#334155] mb-2">
                    Judge Weight
                  </label>
                  <input
                    id="judgeWeight"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={evaluationLogic.judgeWeight}
                    onChange={(e) => setEvaluationLogic({ ...evaluationLogic, judgeWeight: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'roles':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Roles & Permissions</h2>
                <p className="text-[#64748B]">Define roles and their permissions for your template.</p>
              </div>
              <Button onClick={addRole} variant="secondary" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Role
              </Button>
            </div>

            <div className="space-y-4">
              {roles.map((role, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 space-y-4">
                      <Input
                        label="Role Name"
                        value={role.name}
                        onChange={(e) => updateRole(index, 'name', e.target.value)}
                        placeholder="e.g., organizer, judge, participant"
                      />
                      <div>
                        <label className="block text-sm font-medium text-[#334155] mb-2">
                          Description
                        </label>
                        <textarea
                          value={role.description}
                          onChange={(e) => updateRole(index, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
                          placeholder="Describe this role's purpose"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#334155] mb-2">
                          Permissions
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {role.permissions.map((perm, permIndex) => (
                            <Badge key={permIndex} variant="secondary" className="flex items-center gap-1">
                              {perm}
                              <button
                                onClick={() => removePermission(index, permIndex)}
                                className="ml-1 hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              addPermission(index, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="w-full px-4 py-2 rounded-lg border border-[#E2E8F0]"
                        >
                          <option value="">Add Permission</option>
                          <option value="create">Create</option>
                          <option value="edit">Edit</option>
                          <option value="view_all">View All</option>
                          <option value="view_submissions">View Submissions</option>
                          <option value="evaluate">Evaluate</option>
                          <option value="submit">Submit</option>
                          <option value="vote">Vote</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => removeRole(index)}
                      className="ml-4 text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'integrity':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Integrity Rules</h2>
              <p className="text-[#64748B]">Configure integrity and verification guarantees.</p>
            </div>

            <div className="space-y-4">
              <Card className="p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integrityRules.immutableAfterLaunch}
                    onChange={(e) => setIntegrityRules({ ...integrityRules, immutableAfterLaunch: e.target.checked })}
                    className="w-5 h-5 rounded border-[#E2E8F0] text-[#4F46E5] focus:ring-[#4F46E5]"
                  />
                  <div>
                    <span className="font-medium text-[#0F172A]">Rules immutable after launch</span>
                    <p className="text-sm text-[#64748B]">Prevent rule changes after hackathon starts</p>
                  </div>
                </label>
              </Card>

              <Card className="p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integrityRules.requireCommitments}
                    onChange={(e) => setIntegrityRules({ ...integrityRules, requireCommitments: e.target.checked })}
                    className="w-5 h-5 rounded border-[#E2E8F0] text-[#4F46E5] focus:ring-[#4F46E5]"
                  />
                  <div>
                    <span className="font-medium text-[#0F172A]">Require cryptographic commitments</span>
                    <p className="text-sm text-[#64748B]">All actions must be committed immutably</p>
                  </div>
                </label>
              </Card>

              <Card className="p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integrityRules.publicAuditLog}
                    onChange={(e) => setIntegrityRules({ ...integrityRules, publicAuditLog: e.target.checked })}
                    className="w-5 h-5 rounded border-[#E2E8F0] text-[#4F46E5] focus:ring-[#4F46E5]"
                  />
                  <div>
                    <span className="font-medium text-[#0F172A]">Public audit log</span>
                    <p className="text-sm text-[#64748B]">Make all actions publicly auditable</p>
                  </div>
                </label>
              </Card>

              <Card className="p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integrityRules.allowVoteEditing}
                    onChange={(e) => setIntegrityRules({ ...integrityRules, allowVoteEditing: e.target.checked })}
                    className="w-5 h-5 rounded border-[#E2E8F0] text-[#4F46E5] focus:ring-[#4F46E5]"
                  />
                  <div>
                    <span className="font-medium text-[#0F172A]">Allow vote editing</span>
                    <p className="text-sm text-[#64748B]">Allow voters to change their votes</p>
                  </div>
                </label>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-2">
                    Minimum Voter Participation
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={integrityRules.minVoterParticipation}
                    onChange={(e) => setIntegrityRules({ ...integrityRules, minVoterParticipation: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-2">
                    Minimum Judge Participation
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={integrityRules.minJudgeParticipation}
                    onChange={(e) => setIntegrityRules({ ...integrityRules, minJudgeParticipation: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'outcome':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Outcome Logic</h2>
              <p className="text-[#64748B]">Configure how results are calculated and ties are broken.</p>
            </div>

            <div>
              <label htmlFor="calculationMethod" className="block text-sm font-medium text-[#334155] mb-2">
                Calculation Method *
              </label>
              <select
                id="calculationMethod"
                value={outcomeLogic.calculationMethod}
                onChange={(e) => setOutcomeLogic({ ...outcomeLogic, calculationMethod: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
              >
                <option value="simple_majority">Simple Majority</option>
                <option value="weighted_average">Weighted Average</option>
                <option value="ranked_choice">Ranked Choice</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label htmlFor="tieBreakingMethod" className="block text-sm font-medium text-[#334155] mb-2">
                Tie Breaking Method
              </label>
              <select
                id="tieBreakingMethod"
                value={outcomeLogic.tieBreakingMethod}
                onChange={(e) => setOutcomeLogic({ ...outcomeLogic, tieBreakingMethod: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
              >
                <option value="random">Random</option>
                <option value="judge_decision">Judge Decision</option>
                <option value="revote">Revote</option>
              </select>
            </div>

            <div>
              <label htmlFor="quorumRequired" className="block text-sm font-medium text-[#334155] mb-2">
                Quorum Required
              </label>
              <input
                id="quorumRequired"
                type="number"
                min="0"
                value={outcomeLogic.quorumRequired}
                onChange={(e) => setOutcomeLogic({ ...outcomeLogic, quorumRequired: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
                placeholder="Minimum number of participants required"
              />
            </div>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                <Lock className="w-6 h-6 text-[#4F46E5]" />
                Preview & Lock
              </h2>
              <p className="text-[#64748B]">
                Review your template configuration. Once created, the template can be used to create hackathons.
              </p>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Template Identity</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-[#64748B]">Name:</span>
                  <span className="ml-2 font-medium text-[#0F172A]">{identity.name}</span>
                </div>
                <div>
                  <span className="text-[#64748B]">Governance Model:</span>
                  <span className="ml-2 font-medium text-[#0F172A]">{identity.governanceModel}</span>
                </div>
                <div>
                  <span className="text-[#64748B]">Complexity:</span>
                  <span className="ml-2 font-medium text-[#0F172A] capitalize">{identity.complexityLevel}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Roles ({roles.length})</h3>
              <div className="space-y-2">
                {roles.map((role, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium text-[#0F172A] capitalize">{role.name}</span>
                    <span className="ml-2 text-[#64748B]">({role.permissions.length} permissions)</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Evaluation Logic</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-[#64748B]">Method:</span>
                  <span className="ml-2 font-medium text-[#0F172A] capitalize">{evaluationLogic.method}</span>
                </div>
                {evaluationLogic.votingMode && (
                  <div>
                    <span className="text-[#64748B]">Voting Mode:</span>
                    <span className="ml-2 font-medium text-[#0F172A] capitalize">{evaluationLogic.votingMode}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }

    const parsed = JSON.parse(adminData);
    setAdmin(parsed);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/admin/hackathons/templates">
              <Button variant="secondary" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Templates
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Create Custom Template</h1>
            <p className="text-[#64748B]">Build a reusable governance framework for your hackathons.</p>
          </div>

          {/* Steps Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
                const isAccessible = index === 0 || isCompleted || isActive;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <button
                        onClick={() => isAccessible && setCurrentStep(step.id)}
                        disabled={!isAccessible}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white shadow-lg'
                            : isCompleted
                            ? 'bg-green-500 text-white'
                            : isAccessible
                            ? 'bg-[#E2E8F0] text-[#64748B] hover:bg-[#CBD5E1]'
                            : 'bg-[#F1F5F9] text-[#CBD5E1] cursor-not-allowed'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-6 h-6" />
                        ) : (
                          <StepIcon className="w-6 h-6" />
                        )}
                      </button>
                      <span className={`mt-2 text-xs font-medium text-center ${
                        isActive ? 'text-[#4F46E5]' : 'text-[#64748B]'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${
                        isCompleted ? 'bg-green-500' : 'bg-[#E2E8F0]'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Step Content */}
          <Card className="mb-6">
            {renderStepContent()}
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={currentStep === 'identity'}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentStep === 'preview' ? (
              <Button
                onClick={handleSubmit}
                isLoading={loading}
                className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:shadow-lg transition-all"
              >
                <Lock className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:shadow-lg transition-all"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
