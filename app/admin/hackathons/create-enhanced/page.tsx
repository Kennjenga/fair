'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Input, DateTimeInput, Badge } from '@/components/ui';
import { Sidebar } from '@/components/layouts';
import { ArrowLeft, ArrowRight, Check, Settings, Eye, Lock, Users, Shield, FileText } from 'lucide-react';

const sidebarItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { label: 'Decisions', href: '/admin/hackathons/templates', icon: '🎯' },
  { label: 'Hackathons', href: '/admin/hackathons', icon: '🏆' },
  { label: 'Integrity Ledger', href: '/admin/integrity', icon: '🔒' },
  { label: 'Templates', href: '/admin/hackathons/templates', icon: '📋' },
  { label: 'Polls', href: '/admin/polls', icon: '🗳️' },
];

type Step = 'basic' | 'governance' | 'form' | 'preview';

/**
 * Enhanced hackathon creation flow with multi-step wizard
 * Implements PRD Section 8: Hackathon Creation Flow
 */
function CreateHackathonEnhancedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');

  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [template, setTemplate] = useState<any>(null);
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [basicData, setBasicData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    votingClosesAt: '',
    submissionDeadline: '',
    evaluationDeadline: '',
  });

  const [governanceConfig, setGovernanceConfig] = useState<any>(null);
  const [customConfig, setCustomConfig] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }

    const parsed = JSON.parse(adminData);
    setAdmin(parsed);

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
        setGovernanceConfig(data.template.config);
        setCustomConfig(data.template.config);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    }
  };

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: 'basic', label: 'Basic Info', icon: FileText },
    { id: 'governance', label: 'Governance', icon: Settings },
    { id: 'form', label: 'Form Fields', icon: Users },
    { id: 'preview', label: 'Preview & Lock', icon: Eye },
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 'basic':
        return basicData.name.trim().length > 0;
      case 'governance':
        return governanceConfig !== null;
      case 'form':
        return true; // Form fields are optional
      case 'preview':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;

    const stepOrder: Step[] = ['basic', 'governance', 'form', 'preview'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder: Step[] = ['basic', 'governance', 'form', 'preview'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
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
      const endpoint = templateId ? '/api/v1/admin/hackathons/from-template' : '/api/v1/admin/hackathons';
      const requestBody = templateId
        ? {
            templateId,
            name: basicData.name,
            description: basicData.description || undefined,
            startDate: basicData.startDate || undefined,
            endDate: basicData.endDate || undefined,
            votingClosesAt: basicData.votingClosesAt || undefined,
            submissionDeadline: basicData.submissionDeadline || undefined,
            evaluationDeadline: basicData.evaluationDeadline || undefined,
            customConfig: customConfig || undefined,
          }
        : {
            name: basicData.name,
            description: basicData.description || undefined,
            startDate: basicData.startDate || undefined,
            endDate: basicData.endDate || undefined,
            votingClosesAt: basicData.votingClosesAt || undefined,
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Basic Information</h2>
              <p className="text-[#64748B]">Provide the essential details for your hackathon.</p>
            </div>

            <Input
              label="Hackathon Name *"
              id="name"
              type="text"
              value={basicData.name}
              onChange={(e) => setBasicData({ ...basicData, name: e.target.value })}
              required
              placeholder="e.g., Hackathon 2025"
            />

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[#334155] mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={basicData.description}
                onChange={(e) => setBasicData({ ...basicData, description: e.target.value })}
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
                value={basicData.startDate}
                onChange={(e) => setBasicData({ ...basicData, startDate: e.target.value })}
              />

              <Input
                label="End Date"
                id="endDate"
                type="date"
                value={basicData.endDate}
                onChange={(e) => setBasicData({ ...basicData, endDate: e.target.value })}
              />
            </div>

            <DateTimeInput
              label="Voting Closes At"
              id="votingClosesAt"
              value={basicData.votingClosesAt}
              onChange={(value) => setBasicData({ ...basicData, votingClosesAt: value })}
              helperText="When voting closes, the hackathon status will automatically change to 'closed'."
            />

            {templateId && (
              <div className="grid md:grid-cols-2 gap-6">
                <DateTimeInput
                  label="Submission Deadline"
                  id="submissionDeadline"
                  value={basicData.submissionDeadline}
                  onChange={(value) => setBasicData({ ...basicData, submissionDeadline: value })}
                />

                <DateTimeInput
                  label="Evaluation Deadline"
                  id="evaluationDeadline"
                  value={basicData.evaluationDeadline}
                  onChange={(value) => setBasicData({ ...basicData, evaluationDeadline: value })}
                />
              </div>
            )}
          </div>
        );

      case 'governance':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Governance Configuration</h2>
              <p className="text-[#64748B]">
                Configure roles, permissions, evaluation logic, and integrity rules. {template && 'You can customize the template defaults below.'}
              </p>
            </div>

            {template && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>Template:</strong> {template.name} ({template.governanceModel.replace('_', ' ')})
                </p>
              </Card>
            )}

            {governanceConfig && (
              <div className="space-y-6">
                {/* Roles & Permissions */}
                <div>
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#4F46E5]" />
                    Roles & Permissions
                  </h3>
                  <div className="space-y-3">
                    {governanceConfig.roles?.map((role: any, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-[#0F172A] capitalize">{role.name}</span>
                        </div>
                        {role.description && (
                          <p className="text-sm text-[#64748B] mb-2">{role.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {role.permissions?.map((permission: string, permIndex: number) => (
                            <Badge key={permIndex} variant="secondary" className="text-xs">
                              {permission.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                  <p className="text-xs text-[#64748B] mt-2">
                    Roles and permissions are locked from the template. You can customize them after creating the hackathon.
                  </p>
                </div>

                {/* Evaluation Logic */}
                <div>
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#4F46E5]" />
                    Evaluation Logic
                  </h3>
                  <Card className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-[#64748B]">Method:</span>
                        <span className="ml-2 font-medium text-[#0F172A] capitalize">
                          {governanceConfig.evaluationLogic?.method || 'N/A'}
                        </span>
                      </div>
                      {governanceConfig.evaluationLogic?.votingMode && (
                        <div>
                          <span className="text-[#64748B]">Voting Mode:</span>
                          <span className="ml-2 font-medium text-[#0F172A] capitalize">
                            {governanceConfig.evaluationLogic.votingMode}
                          </span>
                        </div>
                      )}
                      {governanceConfig.evaluationLogic?.votingPermissions && (
                        <div>
                          <span className="text-[#64748B]">Voting Permissions:</span>
                          <span className="ml-2 font-medium text-[#0F172A]">
                            {governanceConfig.evaluationLogic.votingPermissions.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                  <p className="text-xs text-[#64748B] mt-2">
                    Evaluation logic is locked from the template. Changes require creating a custom template.
                  </p>
                </div>

                {/* Integrity Rules */}
                <div>
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#4F46E5]" />
                    Integrity Rules
                  </h3>
                  <Card className="p-4">
                    <div className="space-y-2">
                      {governanceConfig.integrityRules?.immutableAfterLaunch && (
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-[#0F172A]">Rules immutable after launch</span>
                        </div>
                      )}
                      {governanceConfig.integrityRules?.requireCommitments && (
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-[#0F172A]">Cryptographic commitments required</span>
                        </div>
                      )}
                      {governanceConfig.integrityRules?.publicAuditLog && (
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-[#0F172A]">Public audit log enabled</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {!governanceConfig && (
              <Card className="p-8 text-center">
                <p className="text-[#64748B]">No governance configuration available. Please select a template first.</p>
              </Card>
            )}
          </div>
        );

      case 'form':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Participation Form Fields</h2>
              <p className="text-[#64748B]">
                Review the default form fields from your template. You can customize these after creating the hackathon.
              </p>
            </div>

            {template && template.default_form_fields && template.default_form_fields.length > 0 ? (
              <div className="space-y-3">
                {template.default_form_fields.map((field: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-sm">
                          {index + 1}
                        </span>
                        <div>
                          <span className="font-medium text-[#0F172A]">{field.fieldLabel}</span>
                          <span className="ml-2 text-sm text-[#64748B]">({field.fieldType})</span>
                          {field.isRequired && (
                            <Badge variant="secondary" className="ml-2 text-xs">Required</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {field.fieldDescription && (
                      <p className="text-sm text-[#64748B] mt-2">{field.fieldDescription}</p>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-[#64748B]">No default form fields. You can add custom fields after creating the hackathon.</p>
              </Card>
            )}
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
                Review all settings. Once you create the hackathon, governance rules will be locked and cannot be changed.
              </p>
            </div>

            {/* Basic Info Preview */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Basic Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-[#64748B]">Name:</span>
                  <span className="ml-2 font-medium text-[#0F172A]">{basicData.name || 'Not set'}</span>
                </div>
                {basicData.description && (
                  <div>
                    <span className="text-[#64748B]">Description:</span>
                    <p className="mt-1 text-[#0F172A]">{basicData.description}</p>
                  </div>
                )}
                {basicData.startDate && (
                  <div>
                    <span className="text-[#64748B]">Start Date:</span>
                    <span className="ml-2 font-medium text-[#0F172A]">
                      {new Date(basicData.startDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {basicData.endDate && (
                  <div>
                    <span className="text-[#64748B]">End Date:</span>
                    <span className="ml-2 font-medium text-[#0F172A]">
                      {new Date(basicData.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Governance Preview */}
            {template && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Governance Model</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-[#64748B]">Template:</span>
                    <span className="ml-2 font-medium text-[#0F172A]">{template.name}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Governance Model:</span>
                    <span className="ml-2 font-medium text-[#0F172A]">
                      {template.governanceModel.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Complexity:</span>
                    <span className="ml-2 font-medium text-[#0F172A] capitalize">
                      {template.complexityLevel}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Warning */}
            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">Rules Will Be Locked</h4>
                  <p className="text-sm text-yellow-800">
                    After creating the hackathon, all governance rules, roles, and evaluation logic will be locked and cannot be changed.
                    This ensures integrity and prevents rule manipulation after launch.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href={templateId ? `/admin/hackathons/templates/${templateId}` : '/admin/hackathons/templates'}>
              <Button variant="secondary" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Create Hackathon</h1>
            {template && (
              <p className="text-[#64748B]">
                Using template: <span className="font-semibold">{template.name}</span>
              </p>
            )}
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
                      <span className={`mt-2 text-xs font-medium ${
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
              disabled={currentStep === 'basic'}
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
                Create & Lock Hackathon
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

export default function CreateHackathonEnhancedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-[#64748B]">Loading...</div>
      </div>
    }>
      <CreateHackathonEnhancedContent />
    </Suspense>
  );
}
