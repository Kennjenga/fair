'use client';

import Link from 'next/link';
import { Button, Badge, Card } from '@/components/ui';
import { Navbar } from '@/components/layouts';

/**
 * Simple type describing the supported decision templates.
 * This keeps the landing templates page type-safe and easy to extend later.
 */
interface DecisionTemplate {
  /** Human readable name of the template type */
  name: string;
  /** Short identifier used for routing and query params */
  slug: 'hackathon' | 'dao' | 'rolling';
  /** High level description shown to users on the templates page */
  description: string;
  /** Whether this template type is fully available today */
  available: boolean;
  /** Optional helper text for the "Coming soon" templates */
  comingSoonText?: string;
}

/**
 * Static configuration for the three top-level template types.
 * Hackathon is implemented today, while DAO and Rolling Hackathon
 * are clearly marked as coming soon.
 */
const decisionTemplates: DecisionTemplate[] = [
  {
    name: 'Hackathon',
    slug: 'hackathon',
    description:
      'Run time-boxed hackathons with transparent submissions, verifiable participation, and flexible judging criteria.',
    available: true,
  },
  {
    name: 'DAO Decision',
    slug: 'dao',
    description:
      'On-chain governance for DAOs with token-weighted voting, proposals, and verifiable outcomes.',
    available: false,
    comingSoonText: 'Designing native DAO flows with on-chain verification.',
  },
  {
    name: 'Rolling Hackathon',
    slug: 'rolling',
    description:
      'Long-running hackathons focused on continuous building, with progress tracking for each team over time.',
    available: false,
    comingSoonText: 'Continuous hackathons with milestone-based progress tracking.',
  },
];

/**
 * Public templates catalog page shown at `/templates`.
 * Users can explore the available decision types and start a new Hackathon.
 */
export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Reuse the existing top navbar so navigation stays consistent */}
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-10 md:py-16">
        {/* Page header introducing templates as top-level decision types */}
        <header className="mb-10 md:mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-[#4F46E5]/10 to-[#6366F1]/10 text-[#4F46E5] border-[#4F46E5]/20">
            Decision Templates
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Choose how your community makes decisions
          </h1>
          <p className="text-[#64748B] max-w-2xl">
            Start with a hackathon today, or preview the upcoming DAO and Rolling Hackathon
            templates designed for long-term, tamper-proof decision making.
          </p>
        </header>

        {/* Templates grid */}
        <section className="grid gap-6 md:grid-cols-3">
          {decisionTemplates.map((template) => {
            const isAvailable = template.available;

            return (
              <Card
                key={template.slug}
                className="flex flex-col justify-between border border-[#E2E8F0] hover:shadow-lg transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold">{template.name}</h2>
                    {!isAvailable && (
                      <Badge variant="secondary" className="text-xs">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-[#64748B] mb-4">{template.description}</p>

                  {!isAvailable && template.comingSoonText && (
                    <p className="text-xs text-[#94A3B8]">
                      {template.comingSoonText}
                    </p>
                  )}
                </div>

                <div className="mt-6">
                  {isAvailable ? (
                    /**
                     * Primary CTA for the Hackathon template.
                     * If the user is not logged in as an admin they will be redirected
                     * to admin login before creating the hackathon.
                     * The `type=hackathon` query param allows the admin UI to know
                     * which template type was selected.
                     */
                    <Link href="/admin/hackathons/create?type=hackathon">
                      <Button className="w-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1]">
                        Start a Hackathon
                      </Button>
                    </Link>
                  ) : (
                    /**
                     * For templates that are not yet available, we show a disabled
                     * button and avoid wiring any backend behavior.
                     * This keeps the intent visible without creating dead flows.
                     */
                    <Button
                      className="w-full bg-gray-200 text-gray-600 cursor-not-allowed"
                      disabled
                    >
                      Coming Soon
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </section>
      </main>
    </div>
  );
}

