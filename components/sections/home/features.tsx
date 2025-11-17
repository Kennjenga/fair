'use client';

import { Card } from '@/components/ui';

const features = [
  {
    icon: '⚡',
    title: 'Real-time Results',
    description: 'See voting results update instantly on the blockchain',
  },
  {
    icon: '🛡️',
    title: 'Self-Voting Prevention',
    description: 'Smart contracts prevent teams from voting for themselves',
  },
  {
    icon: '📊',
    title: 'Advanced Voting Modes',
    description: 'Support for ranked choice, simple majority, and ranked voting',
  },
  {
    icon: '✅',
    title: 'Quorum Support',
    description: 'Set minimum participation requirements for valid results',
  },
  {
    icon: '🔄',
    title: 'Vote Editing',
    description: 'Allow voters to change their vote before poll closes',
  },
  {
    icon: '📈',
    title: 'Tie Breaking',
    description: 'Intelligent algorithms to handle tied results fairly',
  },
];

/**
 * Features section showcasing FAIR platform capabilities
 */
export const Features = () => {
  return (
    <section className="py-20 md:py-32 bg-[#F8FAFC]">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-4">
            Powerful Features
          </h2>
          <p className="text-lg text-[#334155]">
            Everything you need for fair, transparent, and secure voting
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-[#0F172A] mb-3">
                {feature.title}
              </h3>
              <p className="text-[#334155]">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
