'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Alert } from '@/components/ui';

/**
 * Admin login page content
 */
function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('signup') === 'success') {
      setSuccess('Account created successfully! Please login.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store token
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('admin', JSON.stringify(data.admin));

      // Redirect based on role
      if (data.admin.role === 'super_admin') {
        router.push('/super-admin/dashboard');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4F46E5] to-[#6366F1] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-xl p-8 w-full max-w-md border border-[#E2E8F0] dark:border-[#374151]">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#0F172A] dark:text-white mb-2">
            FAIR Voting
          </h1>
          <p className="text-[#334155] dark:text-[#9CA3AF]">Admin Login</p>
        </div>

        {/* Alerts */}
        {success && <Alert type="success" message={success} />}
        {error && <Alert type="error" message={error} />}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <Input
            label="Email"
            type="email"
            placeholder="admin@example.com"
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
            className="w-full"
            size="lg"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        {/* Links */}
        <div className="mt-6 space-y-3 text-center">
          <Link
            href="/admin/forgot-password"
            className="block text-[#4F46E5] dark:text-[#818CF8] hover:text-[#4338CA] dark:hover:text-[#C7D2FE] text-sm font-medium transition-colors"
          >
            Forgot Password?
          </Link>
          <p className="text-[#334155] dark:text-[#9CA3AF] text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="text-[#4F46E5] dark:text-[#818CF8] hover:text-[#4338CA] dark:hover:text-[#C7D2FE] font-semibold">
              Sign Up
            </Link>
          </p>
          <Link href="/" className="block text-[#4F46E5] dark:text-[#818CF8] hover:text-[#4338CA] dark:hover:text-[#C7D2FE] text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Admin login page with Suspense boundary
 */
export default function AdminLogin() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#4F46E5] to-[#6366F1] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}


