'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Alert } from '@/components/ui';

/**
 * Public signup page
 */
export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Redirect to login
      router.push('/admin/login?signup=success');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4F46E5] to-[#6366F1] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-[#E2E8F0]">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">
            FAIR Voting
          </h1>
          <p className="text-[#334155]">Create Your Account</p>
        </div>

        {/* Alert */}
        {error && <Alert type="error" message={error} />}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
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
            minLength={8}
            helperText="Must be at least 8 characters"
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />

          <Button
            type="submit"
            disabled={loading}
            isLoading={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-[#334155] text-sm">
            Already have an account?{' '}
            <Link href="/admin/login" className="text-[#4F46E5] hover:text-[#4338CA] font-semibold">
              Login
            </Link>
          </p>
          <Link href="/" className="block text-[#4F46E5] hover:text-[#4338CA] text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}



