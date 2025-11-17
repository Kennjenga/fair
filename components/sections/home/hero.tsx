'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

/**
 * Hero section for FAIR Voting Platform
 * Follows design system with gradient background and clear CTAs
 */
export const Hero = () => {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#4F46E5] overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full mix-blend-multiply filter blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-white/10 rounded-full mix-blend-multiply filter blur-3xl"></div>

      <div className="relative container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Fair Voting, Built on Trust
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Transparent, tamper-proof voting powered by Avalanche blockchain. 
            Empowering hackathons and competitions with anonymous, verifiable results.
          </p>

          {/* CTA buttons */}
          <div className="flex gap-4 justify-center flex-wrap mb-16">
            <Link href="/signup">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-[#4F46E5] hover:bg-[#F8FAFC]"
              >
                Get Started
              </Button>
            </Link>
            <Link href="/vote">
              <Button
                variant="primary"
                size="lg"
                className="bg-white/20 text-white border border-white/30 hover:bg-white/30"
              >
                Cast Your Vote
              </Button>
            </Link>
          </div>

          {/* Features grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            {[
              {
                icon: '🔐',
                title: 'Transparent',
                description: 'Every vote recorded on Avalanche blockchain for immutable proof',
              },
              {
                icon: '🔒',
                title: 'Anonymous',
                description: 'Your vote is private. Only results are public.',
              },
              {
                icon: '✓',
                title: 'Fair',
                description: 'One vote per participant. Tamper-proof results.',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white border border-white/20 hover:bg-white/15 transition-all"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/80 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
