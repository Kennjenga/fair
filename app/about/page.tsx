'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Menu, X, Shield, Users, Eye, Target, Zap, Lock } from "lucide-react";
import { Footer } from '@/components/layouts';
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Docs', href: '/docs' },
    { label: 'Blog', href: '/blog' },
];

const principles = [
    {
        icon: Users,
        title: "User Experience First",
        description: "No wallets, no keys, no gas fees. Participants use a familiar web interface while blockchain operates silently in the background.",
        color: "from-blue-500/10 to-indigo-500/10"
    },
    {
        icon: Shield,
        title: "Integrity Over Authority",
        description: "Outcomes are cryptographically verifiable. Trust is anchored in code and mathematics, not in the reputation of the organizer.",
        color: "from-purple-500/10 to-pink-500/10"
    },
    {
        icon: Eye,
        title: "Progressive Transparency",
        description: "Configurable visibility for public or private decision making, while always preserving the ability to audit the final results.",
        color: "from-emerald-500/10 to-teal-500/10"
    }
];

export default function AboutPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { scrollY } = useScroll();

    useEffect(() => {
        return scrollY.on('change', (latest) => {
            setScrolled(latest > 50);
        });
    }, [scrollY]);

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

                        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-[#334155] transition hover:text-[#4F46E5] rounded-full px-3 py-1"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors text-[#334155]"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </motion.div>

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
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-[#334155] hover:text-[#4F46E5] font-medium py-2 px-4 rounded-lg hover:bg-[#F8FAFC]"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </nav>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </motion.header>

            <div className="relative overflow-hidden">
                {/* Animated background orbs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                        className="absolute top-40 left-20 w-96 h-96 rounded-full opacity-20"
                        style={{
                            background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 70%)',
                        }}
                        animate={{
                            x: [0, 30, 0],
                            y: [0, 50, 0],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 25,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                    <motion.div
                        className="absolute top-60 right-10 w-80 h-80 rounded-full opacity-15"
                        style={{
                            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
                        }}
                        animate={{
                            x: [0, -30, 0],
                            y: [0, 40, 0],
                            scale: [1, 1.15, 1],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                </div>

                {/* Hero Section */}
                <section className="relative pt-32 pb-20 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Badge className="mb-6 bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 text-[#4F46E5] border-[#4F46E5]/20">
                                Our Mission
                            </Badge>
                        </motion.div>

                        <motion.h1
                            className="text-5xl md:text-6xl font-bold text-[#0F172A] mb-6 leading-tight"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            Restoring Trust in <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4F46E5] to-[#6366F1]">
                                Digital Decision Making
                            </span>
                        </motion.h1>

                        <motion.p
                            className="text-xl text-[#334155] leading-relaxed max-w-3xl mx-auto"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            FAIR separates trust guarantees from user experience. We use blockchain as an invisible
                            integrity layer to make high-stakes decisions verifiable, transparent, and tamper-proof—without
                            requiring any knowledge of blockchain technology.
                        </motion.p>
                    </div>
                </section>

                {/* Trust Gap Section */}
                <section className="relative py-20 px-4">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            className="text-center mb-16"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl font-bold text-[#0F172A] mb-4">The Trust Gap</h2>
                            <p className="text-lg text-[#334155] max-w-2xl mx-auto">
                                Modern decision-making systems face an impossible choice between usability and verification
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                            >
                                <Card className="h-full border-red-100 bg-gradient-to-br from-red-50/50 to-white">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                            <Lock className="w-6 h-6 text-red-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-[#0F172A]">Centralized Black Boxes</h3>
                                        </div>
                                    </div>
                                    <p className="text-[#334155] leading-relaxed">
                                        Traditional tools like Google Forms require blind trust in administrators.
                                        Outcomes can be manipulated silently, leading to disputes and loss of confidence—organizers
                                        are vulnerable to reputational risk.
                                    </p>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card className="h-full border-amber-100 bg-gradient-to-br from-amber-50/50 to-white">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                            <Zap className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-[#0F172A]">Blockchain Usability Failure</h3>
                                        </div>
                                    </div>
                                    <p className="text-[#334155] leading-relaxed">
                                        Native web3 voting tools are transparent but unusable for the 99%.
                                        Wallets, gas fees, and key management exclude real-world participants and prevent institutional adoption.
                                    </p>
                                </Card>
                            </motion.div>
                        </div>

                        <motion.div
                            className="mt-12 text-center"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="inline-block bg-gradient-to-br from-[#4F46E5]/5 to-[#6366F1]/5 border-[#4F46E5]/20">
                                <div className="flex items-center gap-3">
                                    <Target className="w-6 h-6 text-[#4F46E5]" />
                                    <p className="text-lg font-semibold text-[#0F172A]">
                                        "Blockchain where it matters, invisible where it doesn't."
                                    </p>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </section>

                {/* Principles Section */}
                <section className="relative py-20 px-4 bg-gradient-to-b from-[#F8FAFC] to-white">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            className="text-center mb-16"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl font-bold text-[#0F172A] mb-4">Core Design Principles</h2>
                            <p className="text-lg text-[#334155] max-w-2xl mx-auto">
                                Built for institutions, organizations, and communities that demand integrity without complexity
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {principles.map((principle, index) => (
                                <motion.div
                                    key={principle.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="h-full hover:shadow-xl transition-shadow border-[#4F46E5]/10 group">
                                        <motion.div
                                            className={`w-14 h-14 rounded-xl bg-gradient-to-br ${principle.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                                        >
                                            <principle.icon className="w-7 h-7 text-[#4F46E5]" />
                                        </motion.div>
                                        <h3 className="text-xl font-bold text-[#0F172A] mb-3">
                                            {principle.title}
                                        </h3>
                                        <p className="text-[#334155] leading-relaxed">
                                            {principle.description}
                                        </p>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="relative py-20 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <h2 className="text-4xl font-bold text-[#0F172A]">
                                Ready for Verifiable Decisions?
                            </h2>
                            <p className="text-xl text-[#334155] max-w-2xl mx-auto">
                                Join the organizations moving beyond blind trust.
                                FAIR is currently in early access for select partners.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4 pt-4">
                                <Link href="/signup">
                                    <motion.button
                                        className="px-8 py-4 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Get Started
                                    </motion.button>
                                </Link>
                                <Link href="/docs">
                                    <motion.button
                                        className="px-8 py-4 bg-white text-[#0F172A] border-2 border-[#E2E8F0] rounded-xl font-semibold hover:bg-[#F8FAFC] transition-all"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Read Documentation
                                    </motion.button>
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </div>

            <Footer />
        </main>
    );
}
