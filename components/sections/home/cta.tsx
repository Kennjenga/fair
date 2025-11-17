'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

/**
 * Call-to-action section
 */
export const CTA = () => {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-r from-[#4F46E5] to-[#6366F1]">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to host fair voting?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of organizations using FAIR for transparent, tamper-proof voting
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-white text-[#4F46E5] hover:bg-[#F8FAFC]"
              >
                Create Event
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white/20 text-white border border-white/30 hover:bg-white/30"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
