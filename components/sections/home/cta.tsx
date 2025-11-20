'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';

export const CTA = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      setFormStatus('error');
      return;
    }

    // Simulate form submission (replace with actual API call)
    console.log('Form submitted:', formData);
    setFormStatus('success');

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({ name: '', email: '', message: '' });
      setFormStatus('idle');
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setFormStatus('idle');
  };

  return (
    <section className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] py-20 md:py-28 relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
      />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white/20 rounded-full"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 20}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.2,
          }}
        />
      ))}

      <div className="mx-auto max-w-7xl px-4 relative z-10">
        {/* Two-column grid layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - CTA Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:pt-8"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/90">Ready?</p>
            <h2 className="mt-4 text-4xl font-semibold text-white md:text-5xl leading-tight">
              Deliver transparent results your community can trust
            </h2>
            <p className="mt-6 text-lg text-white/95 leading-relaxed">
              Spin up your first FAIR event for free. Upgrade only when you need dedicated support and advanced compliance features.
            </p>

            <motion.div
              className="mt-10 flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Link href="/signup">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" className="bg-[#4F46E5] text-white hover:bg-[#4F46E5]/90 shadow-xl hover:shadow-2xl transition-all">
                    Start for Free
                  </Button>
                </motion.div>
              </Link>
              <Link href="/docs">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="secondary"
                    size="lg"
                    className="bg-transparent text-[#4F46E5] border border-[#4F46E5] hover:bg-[#4F46E5]/90 hover:text-[#4F46E5] transition-all"
                  >
                    Talk to Sales
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Additional info */}
            <motion.div
              className="mt-12 space-y-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white">
                  ✓
                </span>
                <p className="text-white/90">No credit card required to start</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white">
                  ✓
                </span>
                <p className="text-white/90">Free tier includes unlimited voters</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white">
                  ✓
                </span>
                <p className="text-white/90">Enterprise support available</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 h-full">
              <h3 className="text-2xl font-semibold text-white mb-2">Get in Touch</h3>
              <p className="text-white/90 mb-6">
                Have questions? Send us a message and we'll get back to you shortly.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white/95 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                    placeholder="Your name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/95 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-white/95 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all resize-none"
                    placeholder="Tell us about your event or ask us anything..."
                    required
                  />
                </div>

                {formStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-500/20 border border-green-400/30 text-white px-4 py-3 rounded-lg text-center"
                  >
                    ✓ Message sent successfully! We'll be in touch soon.
                  </motion.div>
                )}

                {formStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-400/30 text-white px-4 py-3 rounded-lg text-center"
                  >
                    ✗ Please fill in all fields.
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-white text-[#4F46E5] font-semibold py-3 px-6 rounded-lg hover:bg-[#F8FAFC] transition-all shadow-lg hover:shadow-xl"
                >
                  Send Message
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
