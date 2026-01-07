'use client';

import { motion } from 'framer-motion';
import { Rocket, Users, FileCheck } from 'lucide-react';
import { Card, Badge } from '@/components/ui';

const benefits = [
  {
    icon: Rocket,
    title: 'Simple to deploy',
    description: 'Launch secure decision-making processes in minutes with intuitive templates—no blockchain expertise required.',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Users,
    title: 'Granular access control',
    description: 'Define roles, permissions, and voting rights with precision—ensuring the right people make the right decisions.',
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    icon: FileCheck,
    title: 'Immutable verification',
    description: 'Every vote is recorded on Avalanche blockchain—creating permanent, tamper-proof audit trails anyone can verify.',
    gradient: 'from-green-500 to-teal-600',
  },
];

export const Benefits = () => {
  return (
    <section className="bg-white py-20 md:py-28 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, #E2E8F0 1px, transparent 1px), linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-5 relative">
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="secondary">Why FAIR</Badge>
          <h2 className="mt-4 text-3xl font-semibold text-[#0F172A] md:text-5xl">
            Trust through transparency, verified by blockchain
          </h2>
          <p className="mt-4 text-lg text-[#334155]">
            FAIR transforms how communities and organizations make decisions—combining user-friendly governance tools with the security of blockchain verification.
          </p>
        </motion.div>

        <div className="space-y-6 lg:col-span-3">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="border border-[#E2E8F0] transition-all duration-300 hover:shadow-lg hover:border-[#4F46E5]/30 group">
                  <div className="flex items-start gap-4">
                    <motion.div
                      className={`flex-shrink-0 p-3 rounded-xl bg-gradient-to-br ${benefit.gradient} text-white`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Icon size={24} strokeWidth={2} />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-[#0F172A] group-hover:text-[#4F46E5] transition-colors">
                        {benefit.title}
                      </h3>
                      <p className="mt-3 text-[#334155]">{benefit.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
