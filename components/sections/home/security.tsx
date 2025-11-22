'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import { Card, Badge } from '@/components/ui';

const assurances = [
  { title: 'SOC2-ready controls', detail: 'Complete separation of duties, comprehensive audit-ready logs, and documented security policies that meet enterprise compliance standards.' },
  { title: 'Blockchain-backed proofs', detail: 'Every vote is cryptographically hashed, timestamped, and permanently recorded on Avalanche blockchain for transparent verification.' },
  { title: 'Compliance toolkit', detail: 'Built-in GDPR export tools, customizable privacy windows, secure data deletion requests, and audit trail exports for regulatory compliance.' },
];

function Counter({ value, delay = 0 }: { value: number; delay?: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 2,
      delay,
      ease: 'easeOut',
    });

    return controls.stop;
  }, [count, value, delay]);

  return <motion.span>{rounded}</motion.span>;
}

export const Trust = () => {
  return (
    <section id="trust" className="bg-[#0F172A] py-20 text-white md:py-28 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 bg-[#4F46E5] rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-80 h-80 bg-[#6366F1] rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2 lg:items-center relative">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="bg-white/10 text-white border-white/20">Security first</Badge>
          <h2 className="mt-4 text-3xl font-semibold md:text-5xl text-white">Auditable from click to chain</h2>
          <p className="mt-4 text-lg text-white/95 leading-relaxed">
            FAIR captures every action—invite sent, vote cast, result exported—and stores it in immutable audit trails ready
            for compliance reviews and regulatory oversight.
          </p>
          <motion.div
            className="mt-8 grid gap-4 sm:grid-cols-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="bg-[#1E293B] rounded-2xl shadow-xl border border-[#22C55E]/40 p-6 md:p-7 text-white relative overflow-hidden group">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                <motion.p
                  className="text-4xl font-bold text-[#22C55E] relative z-10"
                  animate={{
                    textShadow: [
                      '0 0 0px rgba(34, 197, 94, 0)',
                      '0 0 20px rgba(34, 197, 94, 0.5)',
                      '0 0 0px rgba(34, 197, 94, 0)',
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                  }}
                >
                  <Counter value={0} delay={0.5} />
                </motion.p>
                <p className="text-sm text-white relative z-10 font-medium">security incidents</p>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="bg-[#1E293B] rounded-2xl shadow-xl border border-[#818CF8]/40 p-6 md:p-7 text-white relative overflow-hidden group">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                <p className="text-4xl font-bold text-[#818CF8] relative z-10">24/7</p>
                <p className="text-sm text-white relative z-10 font-medium">anomaly monitoring</p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {assurances.map((assurance, index) => (
            <motion.div
              key={assurance.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 group relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Animated gradient border on hover */}
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(90deg, #4F46E5, #6366F1, #4F46E5)',
                  backgroundSize: '200% 100%',
                }}
                animate={{
                  backgroundPosition: ['0% 0%', '200% 0%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
              <div className="relative z-10">
                <h3 className="text-xl font-semibold text-white">{assurance.title}</h3>
                <p className="mt-3 text-white/95 leading-relaxed">{assurance.detail}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
