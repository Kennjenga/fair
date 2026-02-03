'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layouts';
import { Card } from '@/components/ui';

/** Profile shape returned by GET /api/v1/admin/profile */
interface AdminProfile {
  adminId: string;
  email: string;
  role: string;
  displayName: string | null;
  phone: string | null;
  organization: string | null;
  accountId: string;
  createdAt: string;
  updatedAt: string;
}

/** Editable profile fields for the form */
interface ProfileForm {
  displayName: string;
  phoneCountryCode: string;
  phoneNational: string;
  organization: string;
}

/** Common country codes for phone (value includes +) */
const COUNTRY_CODES = [
  { value: '+254', label: 'Kenya (+254)' },
  { value: '+255', label: 'Tanzania (+255)' },
  { value: '+256', label: 'Uganda (+256)' },
  { value: '+1', label: 'US/Canada (+1)' },
  { value: '+44', label: 'UK (+44)' },
  { value: '+91', label: 'India (+91)' },
  { value: '+86', label: 'China (+86)' },
  { value: '+33', label: 'France (+33)' },
  { value: '+49', label: 'Germany (+49)' },
  { value: '+81', label: 'Japan (+81)' },
  { value: '+234', label: 'Nigeria (+234)' },
  { value: '+27', label: 'South Africa (+27)' },
  { value: '+61', label: 'Australia (+61)' },
  { value: '+971', label: 'UAE (+971)' },
  { value: '+353', label: 'Ireland (+353)' },
  { value: '+31', label: 'Netherlands (+31)' },
  { value: '+46', label: 'Sweden (+46)' },
  { value: '+48', label: 'Poland (+48)' },
  { value: '+39', label: 'Italy (+39)' },
  { value: '+34', label: 'Spain (+34)' },
  { value: '+55', label: 'Brazil (+55)' },
  { value: '+52', label: 'Mexico (+52)' },
  { value: '+7', label: 'Russia (+7)' },
] as const;

/**
 * Parse stored phone (e.g. "+254728593820" or "254728593820") into country code and national number.
 * Falls back to Kenya (+254) if no match.
 */
function parsePhone(phone: string | null): { code: string; national: string } {
  if (!phone || !phone.trim()) {
    return { code: '+254', national: '' };
  }
  const digits = phone.replace(/\D/g, '');
  if (!digits.length) return { code: '+254', national: '' };
  // Sort by code length descending so +254 matches before +25
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.value.length - a.value.length);
  const toCodeDigits = (x: { value: string }) => x.value.replace(/\D/g, '');
  for (const c of sorted) {
    const codeDigs = toCodeDigits(c);
    if (digits.length >= codeDigs.length && digits.startsWith(codeDigs)) {
      return { code: c.value, national: digits.slice(codeDigs.length) };
    }
  }
  // No match: use first 1–3 digits as country code and rest as national
  const codeLen = digits.startsWith('1') ? 1 : digits.length >= 3 ? 3 : digits.length >= 2 ? 2 : 1;
  const codeVal = sorted.find((c) => toCodeDigits(c) === digits.slice(0, codeLen))?.value ?? '+254';
  const national = digits.slice(codeLen);
  return { code: codeVal, national };
}

/**
 * Build full international phone from country code and national digits.
 */
function buildPhone(code: string, national: string): string | null {
  const digits = national.replace(/\D/g, '');
  if (!digits.length) return null;
  return `${code}${digits}`;
}

/**
 * Profile page for admin users.
 * Fetches full profile from API, displays all fields, and allows editing display name, phone, and organization.
 */
export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    displayName: '',
    phoneCountryCode: '+254',
    phoneNational: '',
    organization: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    try {
      const res = await fetch('/api/v1/admin/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) {
        setProfile(null);
        return;
      }
      const data: AdminProfile = await res.json();
      setProfile(data);
      const { code, national } = parsePhone(data.phone ?? null);
      setForm({
        displayName: data.displayName ?? '',
        phoneCountryCode: code,
        phoneNational: national,
        organization: data.organization ?? '',
      });
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const adminData = localStorage.getItem('admin');
    if (!localStorage.getItem('auth_token') || !adminData) {
      router.push('/admin/login');
      return;
    }
    fetchProfile();
  }, [router, fetchProfile]);

  const handleStartEdit = () => {
    if (profile) {
      const { code, national } = parsePhone(profile.phone ?? null);
      setForm({
        displayName: profile.displayName ?? '',
        phoneCountryCode: code,
        phoneNational: national,
        organization: profile.organization ?? '',
      });
      setSaveError(null);
      setEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token || !profile) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/v1/admin/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: form.displayName.trim() || null,
          phone: buildPhone(form.phoneCountryCode, form.phoneNational),
          organization: form.organization.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError(err?.error ?? 'Failed to save profile');
        return;
      }
      const updated: AdminProfile = await res.json();
      setProfile(updated);
      setEditing(false);
      // Update sidebar display name in localStorage so Sidebar shows it
      const adminData = localStorage.getItem('admin');
      if (adminData) {
        const parsed = JSON.parse(adminData) as { adminId: string; email: string; role: string };
        localStorage.setItem(
          'admin',
          JSON.stringify({ ...parsed, fullName: updated.displayName ?? undefined })
        );
      }
    } catch {
      setSaveError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-[#334155]">Loading...</div>
      </div>
    );
  }

  const sidebarUser = profile
    ? {
        adminId: profile.adminId,
        email: profile.email,
        role: profile.role,
        fullName: profile.displayName ?? undefined,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar user={sidebarUser} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Profile</h1>
              <p className="text-[#64748B]">Manage your account information</p>
            </div>
            {profile && !editing && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="px-4 py-2 rounded-lg bg-[#6366F1] text-white font-medium hover:bg-[#4F46E5] transition-colors"
              >
                Edit profile
              </button>
            )}
          </div>

          {!profile && !loading ? (
            <Card className="p-6">
              <p className="text-[#64748B]">Unable to load profile.</p>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="space-y-6">
                {/* Display name */}
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-2">Display name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={form.displayName}
                      onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                      placeholder="Your display name"
                      className="w-full max-w-md px-3 py-2 border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                      maxLength={255}
                    />
                  ) : (
                    <p className="text-[#0F172A]">{profile?.displayName || '—'}</p>
                  )}
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-2">Email</label>
                  <p className="text-[#0F172A]">{profile?.email}</p>
                </div>

                {/* Phone (country code + national number) */}
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-2">Phone</label>
                  {editing ? (
                    <div className="flex gap-2 max-w-md">
                      <select
                        value={form.phoneCountryCode}
                        onChange={(e) => setForm((f) => ({ ...f, phoneCountryCode: e.target.value }))}
                        className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent min-w-[140px]"
                        aria-label="Country code"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={form.phoneNational}
                        onChange={(e) => setForm((f) => ({ ...f, phoneNational: e.target.value.replace(/\D/g, '') }))}
                        placeholder="National number"
                        className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                        maxLength={15}
                        inputMode="numeric"
                      />
                    </div>
                  ) : (
                    <p className="text-[#0F172A]">{profile?.phone || '—'}</p>
                  )}
                </div>

                {/* Organization */}
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-2">Organization</label>
                  {editing ? (
                    <input
                      type="text"
                      value={form.organization}
                      onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                      placeholder="Organization or company"
                      className="w-full max-w-md px-3 py-2 border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                      maxLength={255}
                    />
                  ) : (
                    <p className="text-[#0F172A]">{profile?.organization || '—'}</p>
                  )}
                </div>

                {/* Role (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-2">Role</label>
                  <p className="text-[#0F172A] capitalize">{profile?.role?.replace('_', ' ')}</p>
                </div>

                {/* Account ID (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-2">Account ID</label>
                  <p className="text-[#64748B] text-sm font-mono">{profile?.accountId}</p>
                </div>

                {/* Created / updated (read-only) */}
                <div className="flex flex-wrap gap-6 text-sm text-[#64748B]">
                  <span>Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</span>
                  {profile?.updatedAt && (
                    <span>Last updated {new Date(profile.updatedAt).toLocaleDateString()}</span>
                  )}
                </div>

                {/* Edit actions */}
                {editing && (
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-[#6366F1] text-white font-medium hover:bg-[#4F46E5] disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save changes'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-[#334155] font-medium hover:bg-[#F8FAFC] disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                    {saveError && (
                      <span className="text-red-600 text-sm" role="alert">
                        {saveError}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
