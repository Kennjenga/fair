'use client';

import { motion } from 'framer-motion';
import { Download, Smartphone, Share, PlusSquare, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { Button, Logo } from '@/components/ui';
import { usePWA } from '@/components/hooks/usePWA';

export default function InstallPage() {
    const { isStandalone, isInstallable, installPWA } = usePWA();

    return (
        <div className="min-h-screen bg-white relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-[#4F46E5]/10 to-transparent rounded-b-[3rem] -z-10" />

            <div className="max-w-4xl mx-auto px-4 py-12">
                <header className="flex items-center justify-between mb-12">
                    <Link href="/" className="scale-90 origin-left">
                        <Logo size={40} />
                    </Link>
                    <Link href="/admin/login">
                        <Button variant="ghost" className="text-slate-600">Login</Button>
                    </Link>
                </header>

                <main className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-4 border border-blue-100">
                            Install FAIR App
                        </span>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                            Get the full <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6]">App Experience</span>
                        </h1>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                            Install FAIR on your device for offline voting, instant notifications, and a smoother native experience. No app store required.
                        </p>
                    </motion.div>

                    {/* Device Instructions */}
                    <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
                        {/* iOS Instructions */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-slate-50 p-8 rounded-3xl border border-slate-100"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
                                    <svg viewBox="0 0 384 512" fill="currentColor" className="w-6 h-6">
                                        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-xl text-slate-900">iOS / Safari</h3>
                            </div>

                            <ol className="space-y-4">
                                <li className="flex gap-4">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">1</div>
                                    <p className="text-slate-600">Tap the <span className="font-semibold text-slate-900">Share</span> button in Safari</p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">2</div>
                                    <p className="text-slate-600">Scroll down and tap <span className="font-semibold text-slate-900">Add to Home Screen</span></p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">3</div>
                                    <p className="text-slate-600">Tap <span className="font-semibold text-slate-900">Add</span> at the top right</p>
                                </li>
                            </ol>
                        </motion.div>

                        {/* Android Instructions */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-slate-50 p-8 rounded-3xl border border-slate-100"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-[#3DDC84] text-white rounded-xl flex items-center justify-center">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-xl text-slate-900">Android / Chrome</h3>
                            </div>

                            {isInstallable ? (
                                <div className="mb-6">
                                    <Button
                                        onClick={installPWA}
                                        className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white py-6 text-lg rounded-xl shadow-lg shadow-indigo-200"
                                    >
                                        Install App Now
                                    </Button>
                                    <p className="text-xs text-center text-slate-400 mt-2">One-tap install available</p>
                                </div>
                            ) : (
                                <ol className="space-y-4">
                                    <li className="flex gap-4">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">1</div>
                                        <p className="text-slate-600">Tap the <span className="font-semibold text-slate-900">Menu</span> (three dots)</p>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">2</div>
                                        <p className="text-slate-600">Select <span className="font-semibold text-slate-900">Install App</span> or <span className="font-semibold text-slate-900">Add to Home screen</span></p>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">3</div>
                                        <p className="text-slate-600">Confirm by tapping <span className="font-semibold text-slate-900">Install</span></p>
                                    </li>
                                </ol>
                            )}
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
}
