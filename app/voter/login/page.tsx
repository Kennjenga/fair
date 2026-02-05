'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Voter login is now unified with admin login.
 * Redirect to the single login page with voter mode pre-selected.
 */
export default function VoterLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/login?as=voter');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="text-[#64748B]">Redirecting to login...</div>
    </div>
  );
}
