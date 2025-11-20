'use client';

import { motion } from 'framer-motion';
import { Settings, Play, Award } from 'lucide-react';

type Step = {
  title: string;
  description: string;
  detail: string;
  icon: typeof Settings;
  status: string;
};

const steps: Step[] = [
  {
    title: '1. Configure',
    description: 'Import teams, judges, and scoring rules.',
    detail: 'Create categories, quorum rules, and tokenized invites in under five minutes.',
    icon: Settings,
    status: 'Setup Mode',
  },
  {
    title: '2. Launch',
    description: 'Share single-use voting links.',
    detail: 'Live dashboards highlight participation, while automations nudge missing voters.',
    icon: Play,
    status: 'Live Voting',
  },
  {
    title: '3. Review',
    description: 'Export results and audit logs.',
    detail: 'Download hash-backed proofs or sync data to Slack, Notion, and Airtable.',
    icon: Award,
    status: 'Post Event',
  },
];

export const Workflow = () => {
  return (
    <section id="workflow" className="bg-[#F8FAFC] py-20 md:py-28 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #E2E8F0 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="mx-auto max-w-5xl px-4 relative">
        <motion.header
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#6366F1]">Workflow</p>
          <h2 className="mt-4 text-3xl font-semibold text-[#0F172A] md:text-5xl">
            Launch → Monitor → Celebrate
          </h2>
          <p className="mt-4 text-lg text-[#334155]">
            FAIR compresses the entire voting lifecycle into three guided steps.
          </p>
        </motion.header>

        <div className="space-y-8 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.title} className="relative">
                <motion.div
                  className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300 group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Number badge with gradient */}
                      <motion.div
                        className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#6366F1] flex items-center justify-center text-white font-bold text-lg shadow-lg"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        {index + 1}
                      </motion.div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="text-[#6366F1]" size={20} />
                          <p className="text-sm font-semibold text-[#6366F1]">{step.title}</p>
                        </div>
                        <h3 className="text-2xl font-semibold text-[#0F172A] group-hover:text-[#4F46E5] transition-colors">
                          {step.description}
                        </h3>
                        <p className="mt-3 text-[#334155]">{step.detail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[#334155] md:flex-col md:items-end">
                      <motion.span
                        className="h-2 w-2 rounded-full bg-[#4F46E5]"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [1, 0.7, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: index * 0.3,
                        }}
                      />
                      <span className="font-medium">{step.status}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Animated connector line */}
                {!isLast && (
                  <motion.div
                    className="absolute left-10 top-full h-8 w-0.5 bg-gradient-to-b from-[#4F46E5] to-[#6366F1] opacity-30"
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.15 + 0.3 }}
                    style={{ transformOrigin: 'top' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
