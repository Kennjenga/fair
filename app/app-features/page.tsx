'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Bell, Wifi, Smartphone, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button, Logo } from '@/components/ui';

export default function AppFeaturesPage() {
    const features = [
        {
            icon: Wifi,
            title: 'Offline Capability',
            description: 'Access your voting data and results even without an internet connection.',
            color: 'bg-blue-500'
        },
        {
            icon: Zap,
            title: 'Instant Performance',
            description: 'Experience lightning-fast interactions with cached resources and optimized assets.',
            color: 'bg-yellow-500'
        },
        {
            icon: Bell,
            title: 'Real-time Notifications',
            description: 'Stay updated with instant alerts for new polls, voting results, and admin actions.',
            color: 'bg-red-500'
        },
        {
            icon: Smartphone,
            title: 'Native Experience',
            description: 'Enjoy a full-screen, immersive experience designed specifically for your device.',
            color: 'bg-purple-500'
        },
        {
            icon: Shield,
            title: 'Enhanced Security',
            description: 'Biometric authentication support and secure local storage for your credentials.',
            color: 'bg-green-500'
        },
        {
            icon: Lock,
            title: 'Private Voting',
            description: 'Your votes are encrypted locally before being synced to the blockchain.',
            color: 'bg-indigo-500'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10 px-4 py-4 safe-area-top">
                <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
                    <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </Link>
                    <div className="font-bold text-lg text-slate-800">App Features</div>
                    <div className="w-10" /> {/* Spacer for centering */}
                </div>
            </header>

            {/* Hero Section */}
            <div className="bg-[#4F46E5] text-white py-12 px-6 rounded-b-[3rem] shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl transform translate-x-10 -translate-y-10"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500 rounded-full mix-blend-overlay filter blur-3xl transform -translate-x-10 translate-y-10"></div>
                </div>

                <div className="relative z-10 max-w-lg mx-auto text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex justify-center mb-6"
                    >
                        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-lg">
                            <Logo size={48} showText={false} className="text-white" />
                        </div>
                    </motion.div>

                    <h1 className="text-3xl font-bold mb-3">FAIR App Experience</h1>
                    <p className="text-indigo-100 text-lg">
                        You are using the installed version of FAIR. Enjoy enhanced features designed for your device.
                    </p>
                </div>
            </div>

            {/* Features Grid */}
            <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4"
                        >
                            <div className={`${feature.color} p-3 rounded-xl text-white shadow-lg shadow-blue-500/10`}>
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-1">{feature.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Action Button */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-10 mb-8"
                >
                    <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl p-6 text-white text-center shadow-lg">
                        <h3 className="font-bold text-xl mb-2">Ready to Vote?</h3>
                        <p className="opacity-90 mb-6 text-sm">Join secure blockchain voting events happening now.</p>
                        <Link href="/signup">
                            <Button className="w-full bg-white text-violet-600 hover:bg-gray-50 border-0 font-bold py-6 rounded-xl text-lg shadow-md">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
