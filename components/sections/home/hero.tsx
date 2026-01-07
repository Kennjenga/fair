'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button, Badge } from '@/components/ui';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Trust', href: '#trust' },
  { label: 'FAQ', href: '#faq' },
];

const stats = [
  { value: '2.5M+', label: 'Votes cast securely' },
  { value: '1,200+', label: 'Organizations using FAIR' },
  { value: '99.98%', label: 'Uptime reliability' },
];

const highlights = [
  'Blockchain-backed verifiable audit trail',
  'Secure voting with granular access controls',
  'Real-time results & governance enforcement',
];

const trustBadges = ['SOC2 Ready', 'KYC Controls', '24/7 Audit Feed'];

const pollItems = [
  { label: 'Approve Budget Allocation', percentage: 42 },
  { label: 'New Feature Priority', percentage: 34 },
  { label: 'Policy Amendment', percentage: 24 },
];

/**
 * Hero section with floating navigation, white animated background, and CTA grid
 */
export const Hero = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    return scrollY.on('change', (latest) => {
      setScrolled(latest > 50);
    });
  }, [scrollY]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-white">
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

      <div className="relative">
        {/* Floating navigation with rounded borders */}
        <motion.header
          className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-6xl"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="rounded-2xl border transition-all duration-300"
            animate={{
              backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.7)',
              borderColor: scrolled ? 'rgba(79, 70, 229, 0.2)' : 'rgba(226, 232, 240, 0.5)',
              boxShadow: scrolled
                ? '0 10px 40px rgba(0, 0, 0, 0.1)'
                : '0 4px 20px rgba(0, 0, 0, 0.05)',
            }}
            style={{
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex items-center justify-between px-6 py-4">
              <div className="text-xl font-bold bg-gradient-to-r from-[#4F46E5] to-[#6366F1] bg-clip-text text-transparent">
                FAIR
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden items-center gap-8 text-sm font-medium md:flex" aria-label="Primary">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-[#334155] transition hover:text-[#4F46E5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/60 focus-visible:ring-offset-2 rounded-full px-3 py-1"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              {/* Desktop CTAs */}
              <div className="hidden md:flex items-center gap-3">
                <Link href="/admin/login">
                  <Button variant="secondary" size="sm" className="border-[#E2E8F0] text-[#334155] hover:bg-[#F8FAFC] transition-all hover:scale-105">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white hover:shadow-lg transition-all hover:scale-105">
                    Get Started
                  </Button>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors text-[#334155]"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </motion.div>

          {/* Mobile Navigation Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="fixed inset-0 bg-black/30 backdrop-blur-sm -z-10"
                />

                {/* Menu Panel */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-white/95 backdrop-blur-xl border border-[#E2E8F0] shadow-xl p-6"
                >
                  <nav className="flex flex-col gap-3 mb-6">
                    {navLinks.map((link, index) => (
                      <motion.a
                        key={link.href}
                        href={link.href}
                        onClick={(e) => handleNavClick(e, link.href)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="text-[#334155] hover:text-[#4F46E5] text-base font-medium py-2 px-4 rounded-lg hover:bg-[#F8FAFC] transition-colors"
                      >
                        {link.label}
                      </motion.a>
                    ))}
                  </nav>

                  <div className="flex flex-col gap-3">
                    <Link href="/admin/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="secondary" className="w-full border-[#E2E8F0] text-[#334155] hover:bg-[#F8FAFC]">
                        Login
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Hero Content */}
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-32 pb-20 md:pt-40 md:pb-28 lg:grid-cols-12 lg:items-center">
          {/* Copy block */}
          <motion.div
            className="lg:col-span-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Badge className="mb-6 bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 text-[#4F46E5] border-[#4F46E5]/20">
                Powered by Avalanche Blockchain
              </Badge>
            </motion.div>

            <motion.h1
              className="text-4xl font-bold text-[#0F172A] md:text-6xl leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Decisions built on trust, verified by blockchain
            </motion.h1>

            <motion.p
              className="mt-6 text-lg text-[#334155] leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              FAIR delivers transparent, tamper-proof decision-making for communities and organizations. Every vote is verifiable, every outcome is auditable, and every process is secured by Avalanche blockchain.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white hover:shadow-xl transition-all hover:scale-105">
                  Get Started
                </Button>
              </Link>
              <Link href="/vote">
                <Button
                  variant="secondary"
                  size="lg"
                  className="border-[#4F46E5]/30 text-[#4F46E5] hover:bg-[#4F46E5]/5 transition-all hover:scale-105"
                >
                  Explore Platform
                </Button>
              </Link>
            </motion.div>

            <motion.ul
              className="mt-8 space-y-3 text-[#334155]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {highlights.map((item, index) => (
                <motion.li
                  key={item}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                >
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#4F46E5]/10 text-xs font-semibold text-[#4F46E5]">
                    ✓
                  </span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </motion.ul>

            <motion.div
              className="mt-10 flex flex-wrap gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              {trustBadges.map((badge, index) => (
                <motion.span
                  key={badge}
                  className="rounded-full border border-[#4F46E5]/20 bg-[#4F46E5]/5 px-4 py-2 text-sm text-[#4F46E5] font-medium"
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.2,
                    ease: 'easeInOut',
                  }}
                >
                  {badge}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

          {/* Visual block */}
          <motion.div
            className="lg:col-span-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <motion.div
              className="rounded-3xl bg-gradient-to-br from-[#F8FAFC] to-white p-6 border border-[#E2E8F0] shadow-2xl"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="rounded-2xl bg-white p-6 shadow-lg border border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#64748B]">Live Poll</p>
                    <p className="text-2xl font-semibold text-[#0F172A]">Governance Vote</p>
                  </div>
                  <motion.span
                    className="rounded-full bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 px-3 py-1 text-xs font-medium text-[#4F46E5] border border-[#4F46E5]/20"
                    animate={{
                      boxShadow: [
                        '0 0 0 0 rgba(79, 70, 229, 0)',
                        '0 0 0 8px rgba(79, 70, 229, 0.1)',
                        '0 0 0 0 rgba(79, 70, 229, 0)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    Running
                  </motion.span>
                </div>

                <div className="mt-6 space-y-4">
                  {pollItems.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                    >
                      <div className="flex justify-between text-sm text-[#334155]">
                        <p className="font-medium">{item.label}</p>
                        <span className="font-semibold text-[#4F46E5]">{item.percentage}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                        <motion.div
                          className="h-2 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1]"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ delay: 1 + index * 0.1, duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  className="mt-8 grid gap-4 rounded-2xl bg-gradient-to-br from-[#F8FAFC] to-white p-4 md:grid-cols-3 border border-[#E2E8F0]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                >
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      className="text-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.5 + index * 0.1 }}
                    >
                      <p className="text-2xl font-bold bg-gradient-to-r from-[#4F46E5] to-[#6366F1] bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                      <p className="text-xs text-[#64748B] mt-1">{stat.label}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
