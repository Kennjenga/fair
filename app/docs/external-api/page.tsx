'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Key, BookOpen, Zap, CreditCard, AlertCircle, ArrowRight } from 'lucide-react';
import { Footer } from '@/components/layouts';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const navAnchors = [
  { label: 'Overview', href: '#overview' },
  { label: 'Authentication', href: '#authentication' },
  { label: 'Endpoints', href: '#endpoints' },
  { label: 'Rate limits', href: '#rate-limits' },
  { label: 'Charging', href: '#charging' },
  { label: 'Errors', href: '#errors' },
];

/**
 * External API documentation page for hackathon organizations and integrations.
 * Describes base URL, authentication, endpoints, rate limits, and how charging works.
 */
export default function ExternalApiDocsPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/external/v1` : 'https://your-domain.com/api/external/v1';

  return (
    <main className="bg-white min-h-screen">
      <motion.header
        className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-6xl"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div
          className={`rounded-2xl border transition-all duration-300 ${
            scrolled ? 'bg-white/95 border-indigo-200 shadow-lg' : 'bg-white/70 border-slate-200'
          }`}
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <Link href="/docs" className="text-xl font-bold bg-gradient-to-r from-[#4F46E5] to-[#6366F1] bg-clip-text text-transparent">
              FAIR
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              {navAnchors.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-[#334155] hover:text-[#4F46E5] transition"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/docs/external-api/try" className="text-sm font-medium text-[#4F46E5] hover:underline">
                Try it (Swagger)
              </Link>
              <Link href="/admin/integrations" className="text-sm font-medium text-[#4F46E5] hover:underline">
                Manage API keys
              </Link>
              <Link href="/docs" className="text-sm text-[#64748B] hover:text-[#334155]">
                Docs home
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      <section className="relative bg-gradient-to-b from-[#0F172A] to-[#1E293B] text-white pt-32 pb-20 px-4">
        <div className="relative max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-white/10 text-white border-white/20">External API</Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">External API (v1)</h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Integrate FAIR voting into your hackathon or external systems. Authenticate with an API key, call the same voting and results endpoints, and stay within rate limits.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-20">
        <motion.section id="overview" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Card className="p-8 border-[#E2E8F0]">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-[#4F46E5]" />
              <h2 className="text-2xl font-bold text-[#0F172A]">Overview</h2>
            </div>
            <p className="text-[#334155] mb-4">
              The External API is for <strong>hackathon organizers</strong> and <strong>external systems</strong> that need to:
            </p>
            <ul className="list-disc list-inside text-[#334155] space-y-2 mb-4">
              <li>List and inspect hackathons and polls they own</li>
              <li>Fetch poll results (when allowed by poll settings)</li>
              <li>Validate voter tokens and submit votes programmatically</li>
            </ul>
            <p className="text-[#334155] mb-2">
              <strong>Base URL:</strong>
            </p>
            <code className="block px-4 py-2 bg-[#F8FAFC] rounded-lg text-sm font-mono text-[#0F172A] mb-4">
              {baseUrl}
            </code>
            <p className="text-[#334155] text-sm">
              All responses are JSON. Use HTTPS in production. Authentication is required on every request via an API key.
            </p>
          </Card>
        </motion.section>

        <motion.section id="authentication" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Card className="p-8 border-[#E2E8F0]">
            <div className="flex items-center gap-3 mb-6">
              <Key className="w-6 h-6 text-[#4F46E5]" />
              <h2 className="text-2xl font-bold text-[#0F172A]">Authentication</h2>
            </div>
            <p className="text-[#334155] mb-4">
              Send your API key on every request using one of these methods:
            </p>
            <ul className="space-y-3 text-[#334155] mb-4">
              <li>
                <strong>Header:</strong> <code className="px-2 py-0.5 bg-[#F1F5F9] rounded text-sm">X-API-Key: &lt;your_api_key&gt;</code>
              </li>
              <li>
                <strong>Bearer token:</strong> <code className="px-2 py-0.5 bg-[#F1F5F9] rounded text-sm">Authorization: Bearer &lt;your_api_key&gt;</code>
              </li>
            </ul>
            <p className="text-[#334155] mb-4">
              API keys are created in the admin dashboard under <strong>Integrations</strong>. Each key is tied to your admin account; you can create multiple keys (e.g. one per integration) and revoke them at any time. The raw key is shown only once when you create it—store it securely.
            </p>
            <Link href="/admin/integrations" className="inline-flex items-center gap-2 text-[#4F46E5] font-medium hover:underline">
              Manage API keys
              <ArrowRight size={16} />
            </Link>
          </Card>
        </motion.section>

        <motion.section id="endpoints" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Card className="p-8 border-[#E2E8F0]">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-6">Endpoints</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left py-3 font-semibold text-[#0F172A]">Method</th>
                    <th className="text-left py-3 font-semibold text-[#0F172A]">Path</th>
                    <th className="text-left py-3 font-semibold text-[#0F172A]">Description</th>
                  </tr>
                </thead>
                <tbody className="text-[#334155]">
                  <tr className="border-b border-[#E2E8F0]">
                    <td className="py-3 font-mono text-green-600">GET</td>
                    <td className="py-3 font-mono">/hackathons</td>
                    <td className="py-3">List hackathons for your organization</td>
                  </tr>
                  <tr className="border-b border-[#E2E8F0]">
                    <td className="py-3 font-mono text-green-600">GET</td>
                    <td className="py-3 font-mono">/hackathons/:id</td>
                    <td className="py-3">Get one hackathon by ID</td>
                  </tr>
                  <tr className="border-b border-[#E2E8F0]">
                    <td className="py-3 font-mono text-green-600">GET</td>
                    <td className="py-3 font-mono">/hackathons/:id/polls</td>
                    <td className="py-3">List polls for a hackathon</td>
                  </tr>
                  <tr className="border-b border-[#E2E8F0]">
                    <td className="py-3 font-mono text-green-600">GET</td>
                    <td className="py-3 font-mono">/polls/:id</td>
                    <td className="py-3">Get poll details</td>
                  </tr>
                  <tr className="border-b border-[#E2E8F0]">
                    <td className="py-3 font-mono text-green-600">GET</td>
                    <td className="py-3 font-mono">/polls/:id/results</td>
                    <td className="py-3">Get poll results (if public or you own the poll)</td>
                  </tr>
                  <tr className="border-b border-[#E2E8F0]">
                    <td className="py-3 font-mono text-amber-600">POST</td>
                    <td className="py-3 font-mono">/vote/validate</td>
                    <td className="py-3">Validate a voter token; body: <code className="bg-[#F1F5F9] px-1 rounded">{`{ "token": "..." }`}</code></td>
                  </tr>
                  <tr className="border-b border-[#E2E8F0]">
                    <td className="py-3 font-mono text-amber-600">POST</td>
                    <td className="py-3 font-mono">/vote/submit</td>
                    <td className="py-3">Submit a vote (voter or judge); same body as the public vote API</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-[#64748B] mt-4">
              All paths are relative to the base URL above. Request and response shapes match the internal voting API where applicable.
            </p>
          </Card>
        </motion.section>

        <motion.section id="rate-limits" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Card className="p-8 border-[#E2E8F0]">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-[#4F46E5]" />
              <h2 className="text-2xl font-bold text-[#0F172A]">Rate limits</h2>
            </div>
            <p className="text-[#334155] mb-4">
              Each API key has a <strong>requests-per-minute</strong> limit (default 60). When you exceed it, the API returns <strong>429 Too Many Requests</strong> with a <code className="px-2 py-0.5 bg-[#F1F5F9] rounded text-sm">Retry-After</code> header and a JSON body including <code className="px-2 py-0.5 bg-[#F1F5F9] rounded text-sm">retryAfter</code> (seconds) and optional <code className="px-2 py-0.5 bg-[#F1F5F9] rounded text-sm">usage</code> info.
            </p>
            <p className="text-[#334155] text-sm">
              You can set a higher limit per key when creating it in Integrations (e.g. for high-volume integrations). Paid plans may offer higher default limits.
            </p>
          </Card>
        </motion.section>

        <motion.section id="charging" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Card className="p-8 border-[#E2E8F0]">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-6 h-6 text-[#4F46E5]" />
              <h2 className="text-2xl font-bold text-[#0F172A]">How you&apos;re charged</h2>
            </div>
            <p className="text-[#334155] mb-4">
              Usage is <strong>tracked per API key</strong> for billing. Each request is recorded (endpoint and timestamp); no personally identifiable information is stored.
            </p>
            <ul className="list-disc list-inside text-[#334155] space-y-2 mb-4">
              <li><strong>Free tier:</strong> Limited requests per month; suitable for small hackathons and testing.</li>
              <li><strong>Paid tiers:</strong> Higher rate limits and monthly request quotas; contact us for pricing and SLA.</li>
            </ul>
            <p className="text-[#334155] text-sm">
              Rate limits are enforced in real time. If you need a custom plan or higher limits, get in touch via the contact details on the main docs or the FAIR website.
            </p>
          </Card>
        </motion.section>

        <motion.section id="errors" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Card className="p-8 border-[#E2E8F0]">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-6 h-6 text-[#4F46E5]" />
              <h2 className="text-2xl font-bold text-[#0F172A]">Errors</h2>
            </div>
            <p className="text-[#334155] mb-4">Typical HTTP status codes and response bodies:</p>
            <ul className="space-y-3 text-[#334155] text-sm">
              <li><strong>400 Bad Request</strong> — Invalid body or validation failed (e.g. missing token, invalid team ID). Response includes <code className="bg-[#F1F5F9] px-1 rounded">error</code> and optionally <code className="bg-[#F1F5F9] px-1 rounded">details</code>.</li>
              <li><strong>401 Unauthorized</strong> — Missing or invalid/revoked API key. Provide <code className="bg-[#F1F5F9] px-1 rounded">X-API-Key</code> or <code className="bg-[#F1F5F9] px-1 rounded">Authorization: Bearer &lt;key&gt;</code>.</li>
              <li><strong>403 Forbidden</strong> — Valid key but no access to the resource (e.g. results not public, or you don’t own the hackathon/poll).</li>
              <li><strong>404 Not Found</strong> — Hackathon or poll ID not found.</li>
              <li><strong>429 Too Many Requests</strong> — Rate limit exceeded. Response includes <code className="bg-[#F1F5F9] px-1 rounded">retryAfter</code> and <code className="bg-[#F1F5F9] px-1 rounded">usage</code>; use the <code className="bg-[#F1F5F9] px-1 rounded">Retry-After</code> header to back off.</li>
              <li><strong>500 Internal Server Error</strong> — Server error; retry with backoff.</li>
            </ul>
          </Card>
        </motion.section>

        <div className="text-center pt-8 flex flex-wrap justify-center gap-4">
          <Link href="/docs/external-api/try">
            <motion.span
              className="inline-block px-8 py-4 bg-white border-2 border-[#4F46E5] text-[#4F46E5] rounded-xl font-semibold shadow hover:shadow-lg transition-shadow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Try it (Swagger UI)
            </motion.span>
          </Link>
          <Link href="/admin/integrations">
            <motion.span
              className="inline-block px-8 py-4 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Create API key in Integrations
            </motion.span>
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
