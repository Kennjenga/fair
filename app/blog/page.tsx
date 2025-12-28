'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Menu, X, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Footer } from '@/components/layouts';
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Docs', href: '/docs' },
];

const posts = [
    {
        title: "Why Trustless UX Fails Real Users",
        excerpt: "Blockchain's strongest guarantees mean nothing if the user interface makes them inaccessible. How FAIR bridges the gap between security and usability.",
        readTime: "5 min read",
        status: "Coming Soon",
        date: "Dec 2025",
        gradient: "from-blue-500/5 to-indigo-500/5"
    },
    {
        title: "Blockchain Guarantees Without Blockchain UX",
        excerpt: "We don't ask users to manage keys or pay gas. Here's how we handle cryptography server-side while maintaining integrity.",
        readTime: "7 min read",
        status: "Draft",
        date: "Dec 2025",
        gradient: "from-purple-500/5 to-pink-500/5"
    },
    {
        title: "FAIR vs Traditional Voting Systems",
        excerpt: "A comparative analysis of auditability in centralized systems vs. FAIR's Avalanche-anchored infrastructure.",
        readTime: "10 min read",
        status: "Coming Soon",
        date: "Jan 2026",
        gradient: "from-emerald-500/5 to-teal-500/5"
    },
    {
        title: "Verifiability vs Transparency",
        excerpt: "Transparency isn't enough. Why the ability to independently verify outcomes is the gold standard for high-stakes decisions.",
        readTime: "6 min read",
        status: "Coming Soon",
        date: "Jan 2026",
        gradient: "from-amber-500/5 to-orange-500/5"
    },
    {
        title: "Scaling Decision Integrity Beyond Hackathons",
        excerpt: "From demo days to governance councils. How FAIR's infrastructure adapts to institutional decision-making needs.",
        readTime: "8 min read",
        status: "Coming Soon",
        date: "Feb 2026",
        gradient: "from-rose-500/5 to-red-500/5"
    },
    {
        title: "The Future of Offline Participation",
        excerpt: "Exploring SMS and USSD integration to bring verifiable decision-making to communities without reliable internet access.",
        readTime: "6 min read",
        status: "Coming Soon",
        date: "Feb 2026",
        gradient: "from-cyan-500/5 to-blue-500/5"
    }
];

export default function BlogPage() {
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
                {/* Animated background */}
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        className="absolute top-40 left-20 w-96 h-96 rounded-full opacity-20"
                        style={{
                            background: 'radial-gradient(circle, rgba(79, 70, 229, 0.12) 0%, transparent 70%)',
                        }}
                        animate={{
                            x: [0, 50, 0],
                            y: [0, -30, 0],
                            scale: [1, 1.15, 1],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                    <motion.div
                        className="absolute bottom-40 right-10 w-80 h-80 rounded-full opacity-15"
                        style={{
                            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
                        }}
                        animate={{
                            x: [0, -40, 0],
                            y: [0, 40, 0],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 25,
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
                                Thought Leadership
                            </Badge>
                            <h1 className="text-5xl md:text-6xl font-bold text-[#0F172A] mb-6">The FAIR Blog</h1>
                            <p className="text-xl text-[#334155] max-w-2xl mx-auto">
                                Insights on decision integrity, blockchain infrastructure, and the future of verifiable governance.
                            </p>
                        </motion.div>
                    </div>
                </section>

                <div className="relative max-w-6xl mx-auto px-4 pb-20">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post, index) => (
                            <motion.div
                                key={post.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className={`h-full flex flex-col bg-gradient-to-br ${post.gradient} hover:shadow-2xl transition-all duration-300 group cursor-pointer border-[#E2E8F0]`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge
                                            variant={post.status === "Draft" ? "warning" : "secondary"}
                                            className="text-xs"
                                        >
                                            {post.status}
                                        </Badge>
                                        <div className="flex items-center gap-1 text-sm text-[#64748b]">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{post.readTime}</span>
                                        </div>
                                    </div>

                                    <h2 className="text-xl font-bold text-[#0F172A] mb-3 group-hover:text-[#4F46E5] transition-colors leading-tight">
                                        {post.title}
                                    </h2>

                                    <p className="text-[#334155] mb-6 flex-grow leading-relaxed">
                                        {post.excerpt}
                                    </p>

                                    <div className="pt-4 border-t border-slate-200 flex justify-between items-center mt-auto">
                                        <div className="flex items-center gap-1 text-sm font-medium text-[#64748b]">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{post.date}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm font-semibold text-[#4F46E5] group-hover:gap-2 transition-all">
                                            <span>Read Article</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Newsletter CTA */}
                    <motion.div
                        className="mt-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <Card className="bg-gradient-to-br from-[#4F46E5]/5 to-[#6366F1]/5 border-[#4F46E5]/20 text-center p-8">
                            <h3 className="text-2xl font-bold text-[#0F172A] mb-3">
                                Stay Updated
                            </h3>
                            <p className="text-[#334155] mb-6 max-w-xl mx-auto">
                                Get notified when we publish new articles about decision integrity,
                                blockchain infrastructure, and verifiable governance.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                                />
                                <motion.button
                                    className="px-6 py-3 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Subscribe
                                </motion.button>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
