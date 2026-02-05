'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button, Input, Alert, Logo } from '@/components/ui';

/**
 * Voter registration — create an account to log in and view participation and vote records.
 */
export default function VoterRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/v1/voter/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }
      router.push('/admin/login?registered=1&as=voter');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 70%)' }}
          animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-20 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-[#E2E8F0]/50"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-[#334155] hover:text-[#4F46E5] text-sm font-medium mb-6">
            ← Back to Home
          </Link>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size={48} showText={false} />
            </div>
            <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Voter registration</h1>
            <p className="text-[#334155]">Create an account to view your participation and vote records on the blockchain</p>
          </div>
          {error && <Alert type="error" message={error} />}
          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
              className="w-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white"
              size="lg"
            >
              {loading ? 'Creating account...' : 'Register'}
            </Button>
          </form>
          <p className="mt-6 text-center text-[#334155] text-sm">
            Already have an account?{' '}
            <Link href="/admin/login?as=voter" className="text-[#4F46E5] hover:text-[#4338CA] font-semibold">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
