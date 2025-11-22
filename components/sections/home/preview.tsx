'use client';

import Image from 'next/image';
import { Card, Badge } from '@/components/ui';

export const Preview = () => {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2 lg:items-center">
        <div>
          <Badge variant="secondary">Organizer Console</Badge>
          <h2 className="mt-4 text-3xl font-semibold text-[#0F172A] md:text-5xl">
            Monitor participation, detect anomalies, export proofs
          </h2>
          <p className="mt-4 text-lg text-[#334155]">
            Track every vote, judge, and team with real-time anomaly detection. When an event wraps, export chain proofs or trigger automatic certificate workflows.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Card className="bg-[#EEF2FF] text-[#0F172A]">
              <p className="text-sm font-medium text-[#4F46E5]">Average setup time</p>
              <p className="mt-2 text-3xl font-bold">6 min</p>
              <p className="text-sm text-[#334155]">from import to publish</p>
            </Card>
            <Card>
              <p className="text-sm font-medium text-[#4F46E5]">Audit exports</p>
              <p className="mt-2 text-3xl font-bold">1 click</p>
              <p className="text-sm text-[#334155]">JSON, CSV, PDF options</p>
            </Card>
          </div>
        </div>

        <Card className="relative overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="relative aspect-[4/3] w-full">
            <Image src="/window.svg" alt="Product preview window" fill className="object-contain p-8" />
          </div>
          <div className="mt-4 grid gap-4 border-t border-dashed border-[#CBD5F5] px-4 py-4 text-sm text-[#334155] sm:grid-cols-2">
            <span>Live participation feed</span>
            <span>Role-based alerts</span>
            <span>Token health checks</span>
            <span>Instant quorum status</span>
          </div>
        </Card>
      </div>
    </section>
  );
};

