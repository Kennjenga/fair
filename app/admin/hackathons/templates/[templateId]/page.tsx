'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components/ui';
import { Sidebar } from '@/components/layouts';
import { ArrowLeft, Shield, CheckCircle2, Users, Settings, FileText, Lock } from 'lucide-react';


interface Template {
  templateId: string;
  name: string;
  description: string | null;
  governanceModel: string;
  intendedUse: string | null;
  complexityLevel: 'beginner' | 'intermediate' | 'advanced';
  config: any;
  defaultFormFields: any[];
  isBuiltIn: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Template Detail View
 * Shows full template information and allows creating a hackathon from it
 */
export default function TemplateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.templateId as string;

  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }

    const parsed = JSON.parse(adminData);
    setAdmin(parsed);
    fetchTemplate(templateId, token);
  }, [router, templateId]);

  const fetchTemplate = async (id: string, token: string) => {
    try {
      const response = await fetch(`/api/v1/admin/templates/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplate(data.template);
      } else if (response.status === 404) {
        router.push('/admin/hackathons/templates');
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHackathon = () => {
    router.push(`/admin/hackathons/create-enhanced?template=${templateId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-[#334155]">Loading template...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#64748B] mb-4">Template not found</p>
          <Link href="/admin/hackathons/templates">
            <Button>Back to Templates</Button>
          </Link>
        </div>
      </div>
    );
  }

  const complexityColors: Record<string, string> = {
    beginner: 'bg-green-50 text-green-700 border-green-200',
    intermediate: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    advanced: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/admin/hackathons/templates">
            <Button variant="secondary" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-[#0F172A]">{template.name}</h1>
                  {template.isBuiltIn && (
                    <Badge className="bg-[#4F46E5]/10 text-[#4F46E5] border-[#4F46E5]/20">
                      Built-in
                    </Badge>
                  )}
                </div>
                <Badge className={`${complexityColors[template.complexityLevel]} mb-3`}>
                  {template.complexityLevel.charAt(0).toUpperCase() + template.complexityLevel.slice(1)} Complexity
                </Badge>
              </div>
            </div>

            {template.description && (
              <p className="text-lg text-[#64748B] mb-4">{template.description}</p>
            )}

            {/* Governance Model Badge */}
            <div className="flex items-center gap-2 mb-6">
              <Badge className="bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 text-[#4F46E5] border-[#4F46E5]/20">
                {template.governanceModel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>

            {/* CTA */}
            <div className="flex gap-4">
              <Button
                onClick={handleCreateHackathon}
                className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:shadow-lg transition-all"
                size="lg"
              >
                Create Hackathon from Template
              </Button>
            </div>
          </div>

          {/* Template Details */}
          <div className="space-y-6">
            {/* Intended Use */}
            {template.intendedUse && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#4F46E5]" />
                  Intended Use
                </h2>
                <p className="text-[#64748B]">{template.intendedUse}</p>
              </Card>
            )}

            {/* Roles & Permissions */}
            {template.config?.roles && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#4F46E5]" />
                  Roles & Permissions
                </h2>
                <div className="space-y-3">
                  {template.config.roles.map((role: any, index: number) => (
                    <div key={index} className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
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
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Evaluation Logic */}
            {template.config?.evaluationLogic && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#4F46E5]" />
                  Evaluation Logic
                </h2>
                <div className="space-y-3">
                  <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-[#64748B]">Method:</span>
                        <span className="ml-2 font-medium text-[#0F172A] capitalize">
                          {template.config.evaluationLogic.method || 'N/A'}
                        </span>
                      </div>
                      {template.config.evaluationLogic.votingMode && (
                        <div>
                          <span className="text-[#64748B]">Voting Mode:</span>
                          <span className="ml-2 font-medium text-[#0F172A] capitalize">
                            {template.config.evaluationLogic.votingMode}
                          </span>
                        </div>
                      )}
                      {template.config.evaluationLogic.votingPermissions && (
                        <div>
                          <span className="text-[#64748B]">Voting Permissions:</span>
                          <span className="ml-2 font-medium text-[#0F172A]">
                            {template.config.evaluationLogic.votingPermissions.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Integrity Rules */}
            {template.config?.integrityRules && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#4F46E5]" />
                  Integrity Guarantees
                </h2>
                <div className="space-y-2">
                  {template.config.integrityRules.immutableAfterLaunch && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-[#0F172A]">Rules immutable after launch</span>
                    </div>
                  )}
                  {template.config.integrityRules.requireCommitments && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-[#0F172A]">Cryptographic commitments required</span>
                    </div>
                  )}
                  {template.config.integrityRules.publicAuditLog && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-[#0F172A]">Public audit log enabled</span>
                    </div>
                  )}
                  {template.config.integrityRules.allowVoteEditing !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      {template.config.integrityRules.allowVoteEditing ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-yellow-600" />
                          <span className="text-[#0F172A]">Vote editing allowed</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-red-600" />
                          <span className="text-[#0F172A]">Vote editing disabled</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Default Form Fields */}
            {template.defaultFormFields && template.defaultFormFields.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-[#0F172A] mb-4">Default Participation Form Fields</h2>
                <div className="space-y-2">
                  {template.defaultFormFields.map((field: any, index: number) => (
                    <div key={index} className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between">
                      <div>
                        <span className="font-medium text-[#0F172A]">{field.fieldLabel}</span>
                        <span className="ml-2 text-sm text-[#64748B]">({field.fieldType})</span>
                        {field.isRequired && (
                          <Badge variant="secondary" className="ml-2 text-xs">Required</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Bottom CTA */}
          <Card className="mt-8 p-6 bg-gradient-to-r from-[#4F46E5]/5 to-[#6366F1]/5 border-2 border-[#4F46E5]/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Ready to create your hackathon?</h3>
                <p className="text-sm text-[#64748B]">
                  This template will be used to configure your hackathon's governance rules.
                </p>
              </div>
              <Button
                onClick={handleCreateHackathon}
                className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:shadow-lg transition-all"
                size="lg"
              >
                Create Hackathon
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
