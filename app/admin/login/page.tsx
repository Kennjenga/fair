'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button, Input, Alert, Logo } from '@/components/ui';

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
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated white background with gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-80 h-80 rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, -40, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-72 h-72 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(79, 70, 229, 0.12) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, -40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Floating geometric shapes */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-24 h-24 rounded-2xl bg-gradient-to-br from-[#4F46E5]/10 to-[#6366F1]/5 backdrop-blur-sm"
          animate={{
            rotate: [0, 360],
            y: [0, -20, 0],
          }}
          transition={{
            rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
            y: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/3 w-16 h-16 rounded-full bg-gradient-to-br from-[#6366F1]/10 to-[#4F46E5]/5"
          animate={{
            y: [0, 30, 0],
            x: [0, -15, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/4 w-20 h-20 rounded-3xl bg-gradient-to-br from-[#4F46E5]/8 to-transparent"
          animate={{
            rotate: [0, -180, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-20 w-full max-w-md app-layout">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-[#E2E8F0]/50"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {/* Back to home link */}
            <Link href="/" className="inline-flex items-center gap-2 text-[#334155] hover:text-[#4F46E5] transition-colors mb-6 group browser-only">
              <motion.div
                className="group-hover:-translate-x-1 transition-transform"
                whileHover={{ x: -4 }}
              >
                ←
              </motion.div>
              <span className="text-sm font-medium">Back to Home</span>
            </Link>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Logo size={48} showText={false} />
              </div>
              <h1 className="text-3xl font-bold text-[#0F172A] mb-2">
                Welcome Back
              </h1>
              <p className="text-[#334155]">Sign in to your account</p>
            </div>

            {/* Alerts */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert type="success" message={success} />
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert type="error" message={error} />
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 mt-6">
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
                className="w-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white hover:shadow-xl transition-all hover:scale-[1.02]"
                size="lg"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Links */}
            <div className="mt-6 space-y-3 text-center">
              <Link
                href="/admin/forgot-password"
                className="block text-[#4F46E5] hover:text-[#4338CA] text-sm font-medium transition-colors"
              >
                Forgot Password?
              </Link>
              <p className="text-[#334155] text-sm">
                Don't have an account?{' '}
                <Link href="/signup" className="text-[#4F46E5] hover:text-[#4338CA] font-semibold transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </motion.div>
        </motion.div>
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
