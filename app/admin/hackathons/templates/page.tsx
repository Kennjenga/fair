'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components/ui';
import { Sidebar } from '@/components/layouts';
import { Search, Filter, Plus, ChevronRight, Shield, Users, Award, Zap, Clock, Building2, Network } from 'lucide-react';


interface Template {
  templateId: string;
  name: string;
  description: string | null;
  governanceModel: string;
  intendedUse: string | null;
  complexityLevel: 'beginner' | 'intermediate' | 'advanced';
  isBuiltIn: boolean;
  isPublic: boolean;
}

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
  beginner: 'bg-green-50 text-green-700 border-green-200',
  intermediate: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  advanced: 'bg-red-50 text-red-700 border-red-200',
};

/**
 * Hackathon Template Browser
 * Visual catalog of governance models per PRD Section 6
 */
export default function TemplateBrowserPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGovernanceModel, setSelectedGovernanceModel] = useState<string>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');
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
    fetchTemplates(token);
  }, [router]);

  const fetchTemplates = async (token: string) => {
    try {
      const response = await fetch('/api/v1/admin/templates', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique governance models for filter
  const governanceModels = Array.from(new Set(templates.map(t => t.governanceModel)));

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      template.governanceModel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGovernance = selectedGovernanceModel === 'all' || 
      template.governanceModel === selectedGovernanceModel;

    const matchesComplexity = selectedComplexity === 'all' || 
      template.complexityLevel === selectedComplexity;

    return matchesSearch && matchesGovernance && matchesComplexity;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-[#334155]">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Hackathon Templates</h1>
                <p className="text-[#64748B]">
                  Choose a governance model for your hackathon. Each template defines roles, evaluation logic, and integrity rules.
                </p>
              </div>
              <Link href="/admin/templates/create">
                <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:shadow-lg transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Template
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-8 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all"
                />
              </div>

              {/* Governance Model Filter */}
              <div className="flex items-center gap-2">
                <Filter className="text-[#64748B] w-5 h-5" />
                <select
                  value={selectedGovernanceModel}
                  onChange={(e) => setSelectedGovernanceModel(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all bg-white"
                >
                  <option value="all">All Governance Models</option>
                  {governanceModels.map(model => (
                    <option key={model} value={model}>
                      {model.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* Complexity Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedComplexity}
                  onChange={(e) => setSelectedComplexity(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] transition-all bg-white"
                >
                  <option value="all">All Complexity Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Template Grid */}
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => {
                const Icon = governanceModelIcons[template.governanceModel] || Shield;
                return (
                  <Link key={template.templateId} href={`/admin/hackathons/templates/${template.templateId}`}>
                    <Card className="hover:shadow-xl transition-all cursor-pointer border-l-4 border-[#4F46E5] h-full flex flex-col">
                      <div className="p-6 flex-1">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4F46E5]/10 to-[#6366F1]/10 flex items-center justify-center">
                              <Icon className="w-6 h-6 text-[#4F46E5]" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-[#0F172A] text-lg">{template.name}</h3>
                              {template.isBuiltIn && (
                                <Badge className="bg-[#4F46E5]/10 text-[#4F46E5] border-[#4F46E5]/20 text-xs mt-1">
                                  Built-in
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {template.description && (
                          <p className="text-sm text-[#64748B] mb-4 line-clamp-3">
                            {template.description}
                          </p>
                        )}

                        {/* Governance Model */}
                        <div className="mb-4">
                          <Badge className="bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 text-[#4F46E5] border-[#4F46E5]/20 text-xs">
                            {template.governanceModel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </div>

                        {/* Intended Use */}
                        {template.intendedUse && (
                          <p className="text-xs text-[#64748B] mb-4">
                            <span className="font-medium">Use case:</span> {template.intendedUse}
                          </p>
                        )}

                        {/* Complexity Level */}
                        <div className="mt-auto pt-4 border-t border-[#E2E8F0]">
                          <div className="flex items-center justify-between">
                            <Badge className={`text-xs ${complexityColors[template.complexityLevel]}`}>
                              {template.complexityLevel.charAt(0).toUpperCase() + template.complexityLevel.slice(1)}
                            </Badge>
                            <ChevronRight className="w-5 h-5 text-[#64748B]" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-16 bg-gradient-to-br from-white to-[#F8FAFC]">
              <p className="text-[#64748B] mb-4">No templates found matching your filters.</p>
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGovernanceModel('all');
                  setSelectedComplexity('all');
                }}
              >
                Clear Filters
              </Button>
            </Card>
          )}

          {/* Create Custom Template CTA */}
          <Card className="mt-8 p-6 bg-gradient-to-r from-[#4F46E5]/5 to-[#6366F1]/5 border-2 border-[#4F46E5]/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Need a Custom Template?</h3>
                <p className="text-sm text-[#64748B]">
                  Create your own governance framework tailored to your specific needs.
                </p>
              </div>
              <Link href="/admin/templates/create">
                <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:shadow-lg transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Template
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
