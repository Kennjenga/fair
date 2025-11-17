import { Hero } from '@/components/sections/home/hero';
import { Features } from '@/components/sections/home/features';
import { CTA } from '@/components/sections/home/cta';

/**
 * Home page - Landing page for FAIR Voting Platform
 */
export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <CTA />
    </main>
  );
}

