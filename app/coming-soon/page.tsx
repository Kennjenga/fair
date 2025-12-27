'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Menu, X } from 'lucide-react';
import { Footer } from '@/components/layouts';

const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Docs', href: '/docs' },
];

export default function ComingSoonPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { scrollY } = useScroll();

    useEffect(() => {
        return scrollY.on('change', (latest) => {
            setScrolled(latest > 50);
        });
    }, [scrollY]);

    return (
        <main className="min-h-screen bg-white">
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
                {/* Animated gradient background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
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
                        className="absolute bottom-20 right-20 w-80 h-80 rounded-full opacity-25"
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
                </div>

                <div className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 py-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-2xl text-center space-y-8"
                    >
                        <motion.div
                            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#4F46E5]/10 to-[#6366F1]/10 border border-[#4F46E5]/20 mx-auto mb-6"
                            animate={{
                                rotate: [0, 360],
                            }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                ease: 'linear',
                            }}
                        >
                            <Sparkles className="w-10 h-10 text-[#4F46E5]" />
                        </motion.div>

                        <motion.h1
                            className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4F46E5] to-[#6366F1]"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            Coming Soon
                        </motion.h1>

                        <motion.p
                            className="text-xl text-[#334155] leading-relaxed max-w-xl mx-auto"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            We're rolling out features deliberately to ensure maximum security and integrity.
                            Every addition to FAIR is carefully designed with trust and verifiability in mind.
                        </motion.p>

                        <motion.div
                            className="pt-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 text-[#4F46E5] hover:text-[#4338ca] font-semibold transition-colors group"
                            >
                                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                                Return Home
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
