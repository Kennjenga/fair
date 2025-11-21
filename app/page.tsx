import { Hero } from '@/components/sections/home/hero';
import { SocialProof } from '@/components/sections/home/social-proof';
import { Features } from '@/components/sections/home/features';
import { Benefits } from '@/components/sections/home/benefits';
import { Workflow } from '@/components/sections/home/steps';
import { Preview } from '@/components/sections/home/preview';
import { Trust } from '@/components/sections/home/security';
import { Testimonials } from '@/components/sections/home/testimonials';
import { FAQ } from '@/components/sections/home/faq';
import { CTA } from '@/components/sections/home/cta';
import { Footer } from '@/components/layouts';

export default function Home() {
  return (
    <main className="bg-[#F8FAFC] text-[#0F172A]">
      <Hero />
      <SocialProof />
      <Features />
      <Benefits />
      <Workflow />
      <Preview />
      <Trust />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}

