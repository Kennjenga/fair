'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layouts';
import { Card, Button, Input } from '@/components/ui';
import { Key, Plus, Trash2, Copy, AlertCircle } from 'lucide-react';

/** API key as returned from list (no raw key) */
interface ApiKeyItem {
  api_key_id: string;
  admin_id: string;
  name: string;
  key_prefix: string;
  rate_limit_per_minute: number;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

/**
 * Integrations page: manage API keys for external API access.
 * Admins can create, list, and revoke keys. Raw key is shown only once after creation.
 */
export default function IntegrationsPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ adminId: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createRateLimit, setCreateRateLimit] = useState(60);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  /** Raw key shown once after create; user must copy before closing */
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const authHeaders = (): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchKeys = useCallback(async () => {
    setKeysLoading(true);
    try {
      const res = await fetch('/api/v1/admin/api-keys', { headers: authHeaders() });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setKeys([]);
        return;
      }
      const data = await res.json();
      setKeys(data.keys ?? []);
    } catch {
      setKeys([]);
    } finally {
      setKeysLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }

    try {
      const parsed = JSON.parse(adminData);
      setAdmin(parsed);
    } catch {
      router.push('/admin/login');
      return;
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (admin && !loading) {
      fetchKeys();
    }
  }, [admin, loading, fetchKeys]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          name: createName.trim(),
          rateLimitPerMinute: createRateLimit,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setCreateError(data.error ?? 'Failed to create API key');
        setCreateSubmitting(false);
        return;
      }

      const rawKey = data.key?.rawKey ?? null;
      setNewRawKey(rawKey);
      setCreateName('');
      setCreateRateLimit(60);
      setCreateModalOpen(false);
      setCreateSubmitting(false);
      await fetchKeys();
    } catch {
      setCreateError('Network error');
      setCreateSubmitting(false);
    }
  };

  const handleRevoke = async (apiKeyId: string) => {
    setRevokingId(apiKeyId);
    try {
      const res = await fetch(`/api/v1/admin/api-keys/${apiKeyId}/revoke`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        setKeys((prev) => prev.filter((k) => k.api_key_id !== apiKeyId));
      }
    } finally {
      setRevokingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (s: string | null) => {
    if (!s) return '—';
    try {
      return new Date(s).toLocaleString();
    } catch {
      return s;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-[#334155]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar user={admin || undefined} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Integrations</h1>
            <p className="text-[#64748B]">
              Manage API keys for the External API. Use keys to let hackathons or external systems access the voting API.
            </p>
          </div>

          {/* One-time display of new raw key */}
          {newRawKey && (
            <Card className="p-6 mb-6 border-amber-200 bg-amber-50/50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#0F172A] mb-2">Your new API key (copy it now)</h3>
                  <p className="text-sm text-[#64748B] mb-3">
                    This value is shown only once. Store it securely; you won&apos;t be able to see it again.
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <code className="px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm font-mono break-all">
                      {newRawKey}
                    </code>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => copyToClipboard(newRawKey)}
                    >
                      <Copy size={16} className="mr-1" />
                      Copy
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4"
                    onClick={() => setNewRawKey(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#0F172A]">API keys</h2>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setCreateError(null);
                  setCreateModalOpen(true);
                }}
              >
                <Plus size={18} className="mr-2" />
                Create API key
              </Button>
            </div>

            {keysLoading ? (
              <p className="text-[#64748B]">Loading keys...</p>
            ) : keys.length === 0 ? (
              <p className="text-[#64748B]">No API keys yet. Create one to use the External API.</p>
            ) : (
              <ul className="space-y-4">
                {keys.map((k) => (
                  <li
                    key={k.api_key_id}
                    className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Key size={20} className="text-[#64748B] shrink-0" />
                      <div>
                        <p className="font-medium text-[#0F172A]">{k.name}</p>
                        <p className="text-sm text-[#64748B] font-mono">
                          {k.key_prefix}…
                        </p>
                        <p className="text-xs text-[#64748B] mt-1">
                          Limit: {k.rate_limit_per_minute}/min · Last used: {formatDate(k.last_used_at)} · Created: {formatDate(k.created_at)}
                        </p>
                      </div>
                    </div>
                    {k.revoked_at ? (
                      <span className="text-sm text-amber-600 font-medium">Revoked</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#DC2626] hover:bg-[#FEE2E2]"
                        disabled={revokingId === k.api_key_id}
                        onClick={() => handleRevoke(k.api_key_id)}
                      >
                        <Trash2 size={16} className="mr-1" />
                        Revoke
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <p className="mt-6 text-sm text-[#64748B]">
            <a href="/docs/external-api" className="text-[#4F46E5] hover:underline">
              View External API documentation
            </a>
            {' '}for base URL, endpoints, and usage.
          </p>
        </div>
      </main>

      {/* Create key modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <Card className="w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-[#0F172A] mb-4">Create API key</h3>
            <form onSubmit={handleCreateKey} className="space-y-4">
              <Input
                label="Name"
                placeholder="e.g. Hackathon XYZ integration"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
                maxLength={255}
              />
              <Input
                label="Rate limit (requests per minute)"
                type="number"
                min={1}
                max={10000}
                value={String(createRateLimit)}
                onChange={(e) => setCreateRateLimit(parseInt(e.target.value, 10) || 60)}
              />
              {createError && (
                <p className="text-sm text-[#DC2626]">{createError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="primary" disabled={createSubmitting}>
                  {createSubmitting ? 'Creating…' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setCreateModalOpen(false);
                    setCreateError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
