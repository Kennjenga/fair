'use client';

import Link from 'next/link';
import InstallButton from '@/components/InstallButton';

/**
 * Footer component
 */
export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0F172A] text-white py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-[#818CF8] mb-3">FAIR</h3>
            <p className="text-[#9CA3AF]">
              Transparent, tamper-proof voting powered by blockchain.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-[#9CA3AF]">
              <li><Link href="/vote" className="hover:text-[#818CF8] transition-colors">Cast Vote</Link></li>
              <li><Link href="/admin/login?as=voter" className="hover:text-[#818CF8] transition-colors">Voter login</Link></li>
              <li><Link href="/results" className="hover:text-[#818CF8] transition-colors">Results</Link></li>
              <li><Link href="/docs" className="hover:text-[#818CF8] transition-colors">Documentation</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-[#9CA3AF]">
              <li><Link href="/about" className="hover:text-[#818CF8] transition-colors">About</Link></li>
              <li><Link href="/blog" className="hover:text-[#818CF8] transition-colors">Blog</Link></li>
              <li><Link href="/coming-soon" className="hover:text-[#818CF8] transition-colors">Careers</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-[#9CA3AF]">
              <li><Link href="/coming-soon" className="hover:text-[#818CF8] transition-colors">Privacy</Link></li>
              <li><Link href="/coming-soon" className="hover:text-[#818CF8] transition-colors">Terms</Link></li>
              <li><Link href="/coming-soon" className="hover:text-[#818CF8] transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Install App Section */}
        <div className="border-t border-[#374151] pt-8 pb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h4 className="font-semibold text-white mb-1">Get the Fair App</h4>
              <p className="text-[#9CA3AF] text-sm">
                Install our app for quick access and offline support
              </p>
            </div>
            <InstallButton />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#374151] pt-8">
          <p className="text-center text-[#9CA3AF] text-sm">
            © {currentYear} FAIR LABS Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
