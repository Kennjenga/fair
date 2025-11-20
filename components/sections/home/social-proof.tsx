'use client';

import { motion } from 'framer-motion';

const logos = [
  'Avalanche',
  'ETHGlobal',
  'Devpost',
  'Polygon Guild',
  'MLH',
  'Gitcoin',
  'Chainlink',
  'The Graph'
];

export const SocialProof = () => {
  // Duplicate logos for seamless loop
  const duplicatedLogos = [...logos, ...logos];

  return (
    <section className="bg-white py-14 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #E2E8F0 1px, transparent 0)`,
          backgroundSize: '30px 30px',
        }} />
      </div>

      <div className="mx-auto max-w-7xl px-4 relative">
        <p className="text-center text-sm font-medium text-[#64748B] mb-8 uppercase tracking-wider">
          Trusted by leading hackathon organizers
        </p>

        {/* Continuous scrolling container */}
        <div className="relative flex overflow-hidden">
          <motion.div
            className="flex gap-8 pr-8"
            animate={{
              x: [0, -100 * logos.length],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 25,
                ease: "linear",
              },
            }}
          >
            {duplicatedLogos.map((logo, index) => (
              <div
                key={`${logo}-${index}`}
                className="flex-shrink-0 px-8 py-4 rounded-xl bg-gradient-to-br from-[#F8FAFC] to-white border border-[#E2E8F0] hover:border-[#4F46E5]/30 transition-all duration-300 hover:shadow-md min-w-[180px] flex items-center justify-center"
              >
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#64748B] whitespace-nowrap">
                  {logo}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

