'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VoterSidebar } from '@/components/layouts';
import { Card } from '@/components/ui';
import { User } from 'lucide-react';

/**
 * Voter profile page — shows account email and basic info.
 * Uses same sidebar as voter dashboard.
 */
export default function VoterProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('voter_token');
    const voterData = localStorage.getItem('voter');
    if (!token || !voterData) {
      router.push('/admin/login?as=voter');
      return;
    }
    try {
      const parsed = JSON.parse(voterData) as { email?: string };
      setEmail(parsed.email ?? null);
    } catch {
      setEmail(null);
    }
  }, [router]);

  if (email === null) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-[#64748B]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <VoterSidebar userEmail={email} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Profile</h1>
            <p className="text-[#64748B]">Your voter account information</p>
          </div>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-[#4F46E5]/10">
                <User className="w-8 h-8 text-[#4F46E5]" />
              </div>
              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-1">Email</label>
                  <p className="text-[#0F172A]">{email}</p>
                </div>
                <p className="text-sm text-[#64748B]">
                  You signed in as a voter to view your hackathon participation and vote records on the blockchain.
                  To change your password or sign in again, use the main login page and check &quot;Login as voter&quot;.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
