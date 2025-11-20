'use client';

import { Card, Avatar } from '@/components/ui';

const testimonials = [
  {
    name: 'Mara Patel',
    role: 'Director, ETHGlobal',
    quote: 'FAIR let us run five simultaneous judging tracks with full transparency. The post-event exports saved our ops team days.',
  },
  {
    name: 'Diego Alvarez',
    role: 'Program Manager, MLH',
    quote: 'Judges loved the tokenized access—no passwords to juggle. Real-time quorum alerts took the anxiety out of finals.',
  },
  {
    name: 'Sophie Reed',
    role: 'Chief of Staff, Avalanche',
    quote: 'Security reviews were a breeze thanks to immutable audit logs and the compliance pack. FAIR feels enterprise-ready.',
  },
];

export const Testimonials = () => {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#6366F1]">Voices</p>
          <h2 className="mt-4 text-3xl font-semibold text-[#0F172A] md:text-5xl">Loved by organizers & judges</h2>
          <p className="mt-4 text-lg text-[#334155]">
            Hear how teams keep voting credible without sacrificing speed.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="flex h-full flex-col justify-between">
              <p className="text-lg text-[#0F172A]">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <Avatar alt={testimonial.name} size="lg" />
                <div>
                  <p className="font-semibold text-[#0F172A]">{testimonial.name}</p>
                  <p className="text-sm text-[#334155]">{testimonial.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

