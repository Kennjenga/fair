'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

/**
 * Try-it page for the External API: Swagger UI loaded with the external API OpenAPI spec.
 * Users can authorize with their API key and send test requests.
 */
export default function ExternalApiTryPage() {
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    console.error = (...args: unknown[]) => {
      const msg = String(args[0] ?? '');
      if (msg.includes('UNSAFE_componentWillReceiveProps') || msg.includes('ModelCollapse')) return;
      originalError.apply(console, args);
    };
    console.warn = (...args: unknown[]) => {
      const msg = String(args[0] ?? '');
      if (msg.includes('UNSAFE_componentWillReceiveProps') || msg.includes('componentWillReceiveProps')) return;
      originalWarn.apply(console, args);
    };

    fetch('/api/docs/external')
      .then((res) => res.json())
      .then((data) => setSpec(data))
      .catch((err) => {
        originalError('Failed to load External API spec:', err);
      });

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  if (!spec) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4F46E5] mx-auto" />
        <p className="mt-4 text-[#64748b]">Loading External API spec...</p>
        <Link href="/docs/external-api" className="mt-4 text-sm text-[#4F46E5] hover:underline">
          Back to External API docs
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-[#0F172A]">External API — Try it</span>
        <Link href="/docs/external-api" className="text-sm text-[#4F46E5] hover:underline">
          Back to docs
        </Link>
      </div>
      <div className="swagger-container">
        <SwaggerUI
          spec={spec}
          deepLinking
          displayOperationId={false}
          defaultModelsExpandDepth={1}
          defaultModelExpandDepth={1}
          persistAuthorization
        />
      </div>
    </div>
  );
}
