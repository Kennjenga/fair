'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components/ui';
import { Sidebar } from '@/components/layouts';
import { Shield, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';


/**
 * Integrity Ledger Page
 * Shows all integrity commitments and verification proofs per PRD Section 11
 */
export default function IntegrityLedgerPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
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
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-[#334155]">Loading...</div>
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
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-[#4F46E5]" />
              <div>
                <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Integrity Ledger</h1>
                <p className="text-[#64748B]">
                  View and verify integrity commitments for all decisions. All commitments are independently verifiable.
                </p>
              </div>
            </div>
          </div>

          {/* Placeholder Content */}
          <Card className="p-8 text-center bg-gradient-to-br from-white to-[#F8FAFC]">
            <Shield className="w-16 h-16 text-[#CBD5E1] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[#0F172A] mb-2">Integrity Ledger</h2>
            <p className="text-[#64748B] mb-6 max-w-md mx-auto">
              This page will display all integrity commitments and verification proofs for decisions you've created or participated in.
              Verification must not rely on FAIR servers and can be independently verified.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/admin/dashboard">
                <Button variant="secondary">View My Decisions</Button>
              </Link>
              <Link href="/admin/hackathons">
                <Button className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1]">
                  Manage Hackathons
                </Button>
              </Link>
            </div>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="p-6 border-l-4 border-green-500">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <h3 className="font-semibold text-[#0F172A]">Verifiable</h3>
              </div>
              <p className="text-sm text-[#64748B]">
                All integrity-critical actions are committed immutably and can be independently verified.
              </p>
            </Card>

            <Card className="p-6 border-l-4 border-blue-500">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-[#0F172A]">Immutable Rules</h3>
              </div>
              <p className="text-sm text-[#64748B]">
                Rules cannot change post-launch. All commitments are locked before hackathon launch.
              </p>
            </Card>

            <Card className="p-6 border-l-4 border-purple-500">
              <div className="flex items-center gap-3 mb-2">
                <ExternalLink className="w-6 h-6 text-purple-600" />
                <h3 className="font-semibold text-[#0F172A]">Independent Audit</h3>
              </div>
              <p className="text-sm text-[#64748B]">
                Audit logs are preserved and outcomes can be recomputed independently of FAIR servers.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
