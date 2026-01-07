'use client';

import { motion } from 'framer-motion';
import { Zap, Shield, BarChart3, CheckCircle, RefreshCw, TrendingUp } from 'lucide-react';
import { Card, Badge } from '@/components/ui';

const features = [
  {
    icon: Shield,
    title: 'Blockchain Verification',
    description: 'Every vote is cryptographically secured and recorded on Avalanche for permanent, tamper-proof verification.',
    gradient: 'from-blue-400 to-indigo-500',
  },
  {
    icon: CheckCircle,
    title: 'Privacy & Access Control',
    description: 'Granular permissions ensure only authorized participants can vote while maintaining voter privacy when needed.',
    gradient: 'from-purple-400 to-pink-500',
  },
  {
    icon: BarChart3,
    title: 'Flexible Voting Methods',
    description: 'Support for ranked choice, weighted voting, approval voting, and custom scoring systems for any decision type.',
    gradient: 'from-green-400 to-teal-500',
  },
  {
    icon: Zap,
    title: 'Real-time Transparency',
    description: 'Live dashboards show participation rates and results as they happen, with instant blockchain confirmation.',
    gradient: 'from-yellow-400 to-orange-500',
  },
  {
    icon: TrendingUp,
    title: 'Governance Enforcement',
    description: 'Automated quorum checks, participation thresholds, and configurable rules ensure valid, binding outcomes.',
    gradient: 'from-rose-400 to-red-500',
  },
  {
    icon: RefreshCw,
    title: 'Complete Audit Trails',
    description: 'Immutable logs capture every action with exportable proofs for compliance and accountability.',
    gradient: 'from-cyan-400 to-blue-500',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export const Features = () => {
  return (
    <section id="features" className="bg-[#F8FAFC] py-20 md:py-28 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #E2E8F0 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="mx-auto max-w-6xl px-4 relative">
        <motion.div
          className="mx-auto mb-16 max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="secondary" className="mb-4">
            Platform pillars
          </Badge>
          <h2 className="text-3xl font-semibold text-[#0F172A] md:text-5xl">Verifiable integrity in every decision</h2>
          <p className="mt-4 text-lg text-[#334155]">
            Transparent governance meets blockchain security—designed for organizations that demand accountability and trust.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
              >
                <Card className="h-full border border-[#E2E8F0] transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-transparent relative overflow-hidden group">
                  {/* Gradient border on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`} style={{ padding: '2px' }}>
                    <div className="h-full w-full bg-white rounded-[15px]" />
                  </div>

                  {/* Icon with gradient background */}
                  <motion.div
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} text-white mb-4`}
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Icon size={28} strokeWidth={2} />
                  </motion.div>

                  <h3 className="text-xl font-semibold text-[#0F172A]">{feature.title}</h3>
                  <p className="mt-3 text-[#334155]">{feature.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
