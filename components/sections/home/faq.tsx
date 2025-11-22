'use client';

import { useState } from 'react';
import clsx from 'clsx';

const faqs = [
  {
    question: 'How long does it take to set up an event?',
    answer: 'Most organizers launch in under 10 minutes using presets. Import teams, define categories, and publish tokens in one guided flow.',
  },
  {
    question: 'Can voters change their vote?',
    answer: 'Yes. You can enable secure vote editing until the poll closes. Every edit is logged, and only the final submission counts.',
  },
  {
    question: 'What chains do you support?',
    answer: 'FAIR runs on Avalanche today with a rollup-based roadmap for Polygon and Base. All audits include explorer links.',
  },
  {
    question: 'Is there an API?',
    answer: 'Absolutely. Use REST endpoints to create polls, fetch live results, or push outcomes into Discord/Slack.',
  },
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-[#F8FAFC] py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#6366F1]">FAQs</p>
          <h2 className="mt-4 text-3xl font-semibold text-[#0F172A] md:text-5xl">Answers for ops teams</h2>
          <p className="mt-4 text-lg text-[#334155]">
            Need something else? Email founders@fair.vote and we will help.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <button
                key={faq.question}
                className="w-full rounded-2xl border border-[#E2E8F0] bg-white text-left transition hover:border-[#4F46E5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
              >
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-lg font-semibold text-[#0F172A]">{faq.question}</span>
                  <span
                    className={clsx(
                      'text-2xl text-[#4F46E5] transition-transform',
                      isOpen ? 'rotate-45' : 'rotate-0'
                    )}
                  >
                    +
                  </span>
                </div>
                {isOpen && <p className="px-6 pb-6 text-[#334155]">{faq.answer}</p>}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

