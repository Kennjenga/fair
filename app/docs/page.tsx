'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Menu, X, Box, Layers, GitCommit, Lock, Globe, Shield, Users, Eye, Target, Zap, Check, ArrowRight } from 'lucide-react';
import { Footer } from '@/components/layouts';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const navLinks = [
  { label: 'Overview', href: '#overview' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Security', href: '#security' },
  { label: 'Roadmap', href: '#roadmap' },
];

const architectureLayers = [
  {
    number: "1",
    title: "Experience Layer",
    description: "React + TailwindCSS frontend. No wallets, keys, or blockchain UI exposed to users.",
    icon: Users,
  },
  {
    number: "2",
    title: "Execution Layer",
    description: "Node.js + Express + MongoDB backend. Enforces rules, aggregates results, orchestrates commitments.",
    icon: Layers,
  },
  {
    number: "3",
    title: "Integrity Layer",
    description: "Avalanche C-Chain. Immutable cryptographic commitments and verifiable storage.",
    icon: Shield,
  },
];

const lifecycleSteps = [
  { title: "Configuration", description: "Organizers define rules, timelines, and visibility settings." },
  { title: "Credential Issuance", description: "System generates single-use, time-bound tokens for eligible participants." },
  { title: "Participation", description: "Users vote via web interface using their token. Anonymity is preserved.", active: true },
  { title: "Aggregation", description: "Backend validates rules and aggregates results." },
  { title: "Commitment", description: "Final state is cryptographically committed to Avalanche." },
  { title: "Verification", description: "Independent verification of outcomes using on-chain commitments." }
];

const coreCapabilities = [
  {
    icon: Users,
    title: "Blockchain UX Abstraction",
    description: "No wallets, private keys, or gas fees. Users experience a conventional web interface while all cryptographic guarantees are handled securely in the background.",
  },
  {
    icon: Shield,
    title: "Verifiable Integrity Layer",
    description: "Critical state transitions are cryptographically committed to Avalanche. FAIR cannot alter outcomes undetected—verification does not require trusting FAIR.",
  },
  {
    icon: Target,
    title: "Configurable Decision Logic",
    description: "Rule-based enforcement: one-participant-one-action constraints, self-interest exclusion, time-bound participation, and visibility controls.",
  },
  {
    icon: Eye,
    title: "Progressive Transparency",
    description: "Organizers control public visibility while full auditability is preserved. Participants can trust outcomes even without access to internal calculations.",
  },
];

const roadmapPhases = [
  {
    phase: "Phase 1",
    title: "Foundation",
    status: "Current",
    items: ["Anonymous voting MVP", "Avalanche testnet deployment", "Admin and audit dashboards"]
  },
  {
    phase: "Phase 2",
    title: "Adoption & Trust Validation",
    status: "In Progress",
    items: ["Avalanche mainnet deployment", "Real-world pilots (hackathons, universities, NGOs)", "UX refinements and analytics"]
  },
  {
    phase: "Phase 3",
    title: "Decision Framework Expansion",
    status: "Planned",
    items: ["Weighted and ranked evaluations", "Multi-round decision workflows", "Role-based permissions"]
  },
  {
    phase: "Phase 4",
    title: "Platform Maturity",
    status: "Future",
    items: ["Avalanche L1 deployment", "Cross-organization analytics", "Offline participation (SMS/USSD)"]
  },
];

export default function DocsPage() {
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
    <main className="bg-white">
      {/* Floating Navigation */}
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
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-[#4F46E5] to-[#6366F1] bg-clip-text text-transparent">
              FAIR
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-[#334155] transition hover:text-[#4F46E5] rounded-full px-3 py-1"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/">
                <button className="px-4 py-2 rounded-xl text-sm font-medium text-[#334155] hover:bg-[#F8FAFC] transition-colors">
                  Home
                </button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors text-[#334155]"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </motion.div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm -z-10"
              />
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-white/95 backdrop-blur-xl border border-[#E2E8F0] shadow-xl p-6"
              >
                <nav className="flex flex-col gap-3">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="text-[#334155] hover:text-[#4F46E5] font-medium py-2 px-4 rounded-lg hover:bg-[#F8FAFC]"
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] to-[#1E293B] text-white pt-32 pb-20 px-4">
        {/* Animated Background */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-20 right-20 w-96 h-96 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(79, 70, 229, 0.3) 0%, transparent 70%)',
            }}
            animate={{
              x: [0, 40, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-6 bg-white/10 text-white border-white/20">Documentation</Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">FAIR Infrastructure</h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              A user-first decision integrity infrastructure for real-world adoption of blockchain guarantees.
              Transparent, secure, and tamper-proof decision-making without blockchain complexity.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="relative max-w-6xl mx-auto px-4 py-20">
        {/* Abstract & Overview */}
        <motion.section
          id="overview"
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="p-8 md:p-12 border-[#E2E8F0] shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4F46E5]/10 to-[#6366F1]/10 flex items-center justify-center">
                <Box className="text-[#4F46E5] w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-[#0F172A]">Abstract</h2>
            </div>

            <div className="prose prose-lg text-[#334155] max-w-none space-y-6">
              <p className="text-xl leading-relaxed">
                FAIR is a <strong className="text-[#4F46E5]">trust-first decision infrastructure</strong> designed to make verifiable,
                transparent voting accessible to everyone—without exposing users to the complexity of blockchain technology.
              </p>

              <p className="leading-relaxed">
                Built on Avalanche, FAIR abstracts cryptography, wallets, gas fees, and on-chain interactions behind a familiar
                web interface, enabling individuals and institutions to make high-stakes decisions with confidence.
              </p>

              <div className="bg-[#F8FAFC] border-l-4 border-[#4F46E5] p-6 rounded-r-xl my-8">
                <p className="font-semibold text-[#0F172A] mb-2">Core Thesis</p>
                <p className="text-[#334155] italic">
                  "Blockchain-backed integrity can be delivered without blockchain UX friction. FAIR proves that blockchain's
                  strongest guarantees can be adopted at scale only when they are invisible to users, not imposed on them."
                </p>
              </div>

              <h3 className="text-2xl font-bold text-[#0F172A] mt-12 mb-4">Origin & Motivation</h3>
              <p className="leading-relaxed">
                FAIR was born from repeated failures observed in hackathons, innovation challenges, and community programs.
                Outcomes were disputed not because of poor ideas—but because of <strong>lack of trust in the process</strong>.
                Centralized tools were easy to use but impossible to independently verify.
              </p>

              <p className="leading-relaxed">
                Blockchain promised a solution with immutable records and verifiable integrity, but remained largely inaccessible
                due to wallets, keys, gas fees, and complex workflows. FAIR emerged to bridge this gap: enabling real-world users
                to benefit from blockchain guarantees without ever needing to understand blockchain.
              </p>
            </div>
          </Card>
        </motion.section>

        {/* Problem Statement */}
        <motion.section
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#0F172A] mb-4">The Usability–Trust Gap</h2>
            <p className="text-lg text-[#334155] max-w-3xl mx-auto">
              Modern decision-making systems face a fundamental tension between usability and trust
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="p-8 border-red-100 bg-gradient-to-br from-red-50/50 to-white">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Lock className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A] mb-2">Centralized Tools</h3>
                  <p className="text-[#334155]">
                    Google Forms, spreadsheets, proprietary platforms are easy to use but opaque and unverifiable.
                    Outcomes rely on blind trust in administrators.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-amber-100 bg-gradient-to-br from-amber-50/50 to-white">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A] mb-2">Blockchain-Native Systems</h3>
                  <p className="text-[#334155]">
                    Transparent, secure, and tamper-proof but introduce significant UX complexity: wallets, keys,
                    gas fees, and irreversible actions that exclude non-technical users.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-8 bg-gradient-to-br from-[#4F46E5]/5 to-[#6366F1]/5 border-[#4F46E5]/20">
            <h3 className="font-bold text-lg text-[#0F172A] mb-4">Consequences</h3>
            <ul className="grid md:grid-cols-2 gap-3">
              {[
                "Disputed outcomes and reputational damage",
                "Perceived or real bias in processes",
                "Manual audits and delays",
                "Reduced confidence in outcomes",
                "Exclusion of non-technical participants",
                "Organizers forced to choose between ease and integrity"
              ].map((item) => (
                <li key={item} className="flex gap-2 items-start text-[#334155]">
                  <span className="text-red-500 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </motion.section>

        {/* Core Capabilities */}
        <motion.section
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#0F172A] mb-4">Core Platform Capabilities</h2>
            <p className="text-lg text-[#334155] max-w-3xl mx-auto">
              FAIR separates trust guarantees from user experience through four foundational capabilities
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {coreCapabilities.map((capability, index) => (
              <motion.div
                key={capability.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full p-8 hover:shadow-xl transition-shadow border-[#4F46E5]/10">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#4F46E5]/10 to-[#6366F1]/10 flex items-center justify-center shrink-0">
                      <capability.icon className="w-7 h-7 text-[#4F46E5]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#0F172A] mb-3">{capability.title}</h3>
                      <p className="text-[#334155] leading-relaxed">{capability.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Why Avalanche */}
        <motion.section
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="p-8 md:p-12 border-[#E2E8F0] shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center">
                <Globe className="text-blue-600 w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-[#0F172A]">Why Avalanche</h2>
            </div>

            <p className="text-lg text-[#334155] mb-8 leading-relaxed">
              Avalanche provides the performance and flexibility required to support FAIR's abstraction-first approach:
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: "Fast Finality", description: "Immediate feedback without UX delays—decisions feel instant to users" },
                { title: "Low & Predictable Fees", description: "Enables large-scale participation without cost barriers" },
                { title: "EVM Compatibility", description: "Mature tooling, widespread auditability, and developer ecosystem" },
                { title: "Avalanche L1s", description: "Clear upgrade path to dedicated, application-specific chains for sovereignty and scale" }
              ].map((item) => (
                <div key={item.title} className="flex gap-3 items-start">
                  <Check className="w-5 h-5 text-green-500 mt-1 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-[#0F172A] mb-1">{item.title}</h4>
                    <p className="text-sm text-[#334155]">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-[#334155] italic">
                <strong className="text-[#0F172A]">Note:</strong> Blockchain choice is an implementation detail,
                not a user concern. As FAIR scales, Avalanche L1s enable sovereign execution environments,
                cost isolation, and governance-specific customization.
              </p>
            </div>
          </Card>
        </motion.section>

        {/* System Architecture */}
        <motion.section
          id="architecture"
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="p-8 md:p-12 border-[#E2E8F0] shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4F46E5]/10 to-[#6366F1]/10 flex items-center justify-center">
                <Layers className="text-[#4F46E5] w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-[#0F172A]">System Architecture</h2>
            </div>

            <p className="text-lg text-[#334155] mb-8">
              FAIR is composed of three interdependent layers that work together to deliver blockchain guarantees
              through a conventional user experience:
            </p>

            <div className="space-y-6">
              {architectureLayers.map((layer, index) => (
                <motion.div
                  key={layer.number}
                  className="p-6 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-200"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#4F46E5] text-white font-bold shrink-0">
                      {layer.number}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <layer.icon className="w-5 h-5 text-[#4F46E5]" />
                        <h3 className="font-bold text-[#0F172A] text-xl">{layer.title}</h3>
                      </div>
                      <p className="text-[#334155]">{layer.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-[#F8FAFC] rounded-xl">
              <h4 className="font-bold text-[#0F172A] mb-3">Additional Infrastructure</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex gap-2 items-start">
                  <span className="text-[#4F46E5]">→</span>
                  <p className="text-sm text-[#334155]"><strong>Email Infrastructure:</strong> SMTP / transactional email for reliable token delivery</p>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="text-[#4F46E5]">→</span>
                  <p className="text-sm text-[#334155]"><strong>Data Layer:</strong> MongoDB for configuration, tokens, and aggregated results</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* Decision Lifecycle */}
        <motion.section
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="p-8 md:p-12 border-[#E2E8F0] shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4F46E5]/10 to-[#6366F1]/10 flex items-center justify-center">
                <GitCommit className="text-[#4F46E5] w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-[#0F172A]">Decision Lifecycle</h2>
            </div>

            <div className="relative border-l-2 border-slate-200 ml-6 space-y-10">
              {lifecycleSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  className="pl-10 relative"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center ${step.active
                      ? 'bg-[#4F46E5] shadow-lg shadow-indigo-500/50 text-white font-bold text-sm'
                      : 'bg-slate-200 text-slate-600 font-semibold text-xs'
                    }`}>
                    {index + 1}
                  </span>
                  <h3 className="font-bold text-[#0F172A] text-xl mb-2">{step.title}</h3>
                  <p className="text-[#334155] leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.section>

        {/* Security & Privacy */}
        <motion.section
          id="security"
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="p-8 md:p-12 border-[#E2E8F0] shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/10 to-pink-500/10 flex items-center justify-center">
                <Lock className="text-red-600 w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-[#0F172A]">Security & Privacy Model</h2>
            </div>

            <p className="text-lg text-[#334155] mb-8">
              FAIR is designed with security-first principles and assumes a hostile environment where both internal
              and external adversaries may attempt to manipulate outcomes.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-[#0F172A] mb-4">Threat Model</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <h4 className="font-semibold text-[#0F172A] mb-2">Adversaries</h4>
                    <ul className="space-y-2 text-sm text-[#334155]">
                      <li className="flex gap-2"><span className="text-red-500">•</span> Malicious organizers</li>
                      <li className="flex gap-2"><span className="text-red-500">•</span> Participants circumventing rules</li>
                      <li className="flex gap-2"><span className="text-red-500">•</span> Insider threats with privileged access</li>
                      <li className="flex gap-2"><span className="text-red-500">•</span> External infrastructure attackers</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <h4 className="font-semibold text-[#0F172A] mb-2">Protected Assets</h4>
                    <ul className="space-y-2 text-sm text-[#334155]">
                      <li className="flex gap-2"><span className="text-green-500">✓</span> Result correctness and integrity</li>
                      <li className="flex gap-2"><span className="text-green-500">✓</span> Participation constraint enforcement</li>
                      <li className="flex gap-2"><span className="text-green-500">✓</span> Participant anonymity</li>
                      <li className="flex gap-2"><span className="text-green-500">✓</span> Auditability and verifiability</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#0F172A] mb-4">Attack Resistance</h3>
                <div className="space-y-3">
                  {[
                    { attack: "Organizer Manipulation", defense: "All integrity-critical state committed on-chain—any modification is detectable through independent verification" },
                    { attack: "Double Voting", defense: "Single-use tokens prevent repeated participation; backend enforcement rejects invalid submissions" },
                    { attack: "Backend Compromise", defense: "Immutable commitments on Avalanche prevent undetectable tampering; audit logs ensure detectability" },
                    { attack: "Token Theft", defense: "Tokens are time-bound and one-time use; rate limiting and anomaly detection reduce attack surface" }
                  ].map((item) => (
                    <div key={item.attack} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex gap-3 items-start">
                        <Shield className="w-5 h-5 text-[#4F46E5] mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-semibold text-[#0F172A] mb-1">{item.attack}</h4>
                          <p className="text-sm text-[#334155]">{item.defense}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#0F172A] mb-4">Privacy Guarantees</h3>
                <ul className="space-y-3">
                  {[
                    "No personally identifiable information (PII) stored on-chain",
                    "Votes are anonymized—participant identity never linked to vote choice",
                    "Configurable visibility ensures privacy without compromising auditability",
                    "Email addresses and credentials remain off-chain and secure",
                    "Single-use, expiring tokens with strict validation"
                  ].map((item) => (
                    <li key={item} className="flex gap-3 items-start">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-[#334155]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* Roadmap */}
        <motion.section
          id="roadmap"
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#0F172A] mb-4">Roadmap</h2>
            <p className="text-lg text-[#334155] max-w-3xl mx-auto">
              FAIR's evolution from anonymous voting to comprehensive decision infrastructure
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {roadmapPhases.map((phase, index) => (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`h-full p-8 ${phase.status === 'Current' ? 'border-[#4F46E5] bg-gradient-to-br from-[#4F46E5]/5 to-white' :
                    phase.status === 'In Progress' ? 'border-blue-300 bg-gradient-to-br from-blue-50/50 to-white' :
                      'border-slate-200'
                  }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-[#0F172A]">{phase.phase}</h3>
                    <Badge variant={
                      phase.status === 'Current' ? 'primary' :
                        phase.status === 'In Progress' ? 'info' :
                          'secondary'
                    }>
                      {phase.status}
                    </Badge>
                  </div>
                  <p className="font-semibold text-lg text-[#334155] mb-4">{phase.title}</p>
                  <ul className="space-y-2">
                    {phase.items.map((item) => (
                      <li key={item} className="flex gap-2 items-start text-[#334155]">
                        <ArrowRight className="w-4 h-4 text-[#4F46E5] mt-1 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Vision */}
        <motion.section
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="p-8 md:p-12 bg-gradient-to-br from-[#4F46E5]/5 to-[#6366F1]/5 border-[#4F46E5]/20">
            <div className="text-center max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-[#0F172A] mb-6">Vision</h2>
              <p className="text-xl text-[#334155] leading-relaxed mb-6">
                FAIR envisions a future where <strong>trust is provable by design</strong>, not implied or delegated.
                By eliminating blockchain usability barriers while preserving transparency, security, and tamper-proof
                guarantees, FAIR aims to become a foundational layer for fair, transparent, and accountable
                decision-making across digital and real-world systems.
              </p>
              <div className="inline-block">
                <div className="p-6 bg-white rounded-xl border border-[#4F46E5]/30">
                  <p className="text-lg font-semibold text-[#0F172A] mb-2">
                    The long-term goal is <span className="text-[#4F46E5]">decision legitimacy at scale</span>, not voting alone.
                  </p>
                  <p className="text-[#334155] italic">
                    FAIR is not a voting tool—it is a foundation for decisions that must be trusted, at any scale.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-[#0F172A] mb-6">Ready to Build with FAIR?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/signup">
              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.button>
            </Link>
            <Link href="/about">
              <motion.button
                className="px-8 py-4 bg-white text-[#0F172A] border-2 border-[#E2E8F0] rounded-xl font-semibold hover:bg-[#F8FAFC] transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Learn More
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
