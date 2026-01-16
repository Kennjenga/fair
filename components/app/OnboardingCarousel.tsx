'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, UserCheck, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';

interface OnboardingSlide {
    title: string;
    description: string;
    icon: React.ReactNode;
}

const slides: OnboardingSlide[] = [
    {
        title: 'Decisions You Can Audit',
        description: 'Every vote is recorded on the blockchain, creating an immutable trail you can verify anytime.',
        icon: <Shield className="w-20 h-20 text-[#4F46E5]" strokeWidth={1.5} />,
    },
    {
        title: 'Identity Without Friction',
        description: 'Vote securely with your email. No complex wallet setup required—just simple, verified authentication.',
        icon: <UserCheck className="w-20 h-20 text-[#4F46E5]" strokeWidth={1.5} />,
    },
    {
        title: 'Immutable Proof',
        description: 'Results are cryptographically secured on Avalanche. Trust is built-in, not assumed.',
        icon: <CheckCircle className="w-20 h-20 text-[#4F46E5]" strokeWidth={1.5} />,
    },
];

interface OnboardingCarouselProps {
    onComplete: () => void;
}

/**
 * Onboarding carousel for app mode
 * Shows 3 slides introducing FAIR's key features
 * Uses existing design system colors and components
 */
export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            onComplete();
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col app-layout">
            {/* Skip button */}
            <div className="flex justify-end p-6">
                <button
                    onClick={handleSkip}
                    className="text-[#334155] text-sm font-medium hover:text-[#4F46E5] transition-colors"
                >
                    Skip
                </button>
            </div>

            {/* Slides */}
            <div className="flex-1 flex items-center justify-center px-6 pb-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="w-full max-w-md text-center"
                    >
                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            className="flex justify-center mb-8"
                        >
                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E2E8F0]">
                                {slides[currentSlide].icon}
                            </div>
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                            className="text-3xl font-bold text-[#0F172A] mb-4 leading-tight"
                        >
                            {slides[currentSlide].title}
                        </motion.h2>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.4 }}
                            className="text-lg text-[#334155] leading-relaxed"
                        >
                            {slides[currentSlide].description}
                        </motion.p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Progress indicators */}
            <div className="flex justify-center gap-2 mb-8">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className="transition-all"
                        aria-label={`Go to slide ${index + 1}`}
                    >
                        <div
                            className={`h-2 rounded-full transition-all ${index === currentSlide
                                    ? 'w-8 bg-[#4F46E5]'
                                    : 'w-2 bg-[#E2E8F0]'
                                }`}
                        />
                    </button>
                ))}
            </div>

            {/* Next button */}
            <div className="px-6 pb-8">
                <Button
                    onClick={handleNext}
                    size="lg"
                    className="w-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white hover:shadow-xl transition-all active:scale-95"
                >
                    {currentSlide === slides.length - 1 ? (
                        'Get Started'
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            Next
                            <ChevronRight className="w-5 h-5" />
                        </span>
                    )}
                </Button>
            </div>
        </div>
    );
}
