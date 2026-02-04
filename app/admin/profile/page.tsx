'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layouts';
import { Card } from '@/components/ui';
import { COUNTRY_CODES as ALL_COUNTRY_CODES } from '@/lib/data/country-codes';

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

/** Single country code entry for type-safe use in parsePhone */
type CountryCodeEntry = { value: string; label: string };

/**
 * Parse stored phone (e.g. "+254728593820" or "254728593820") into country code and national number.
 * Uses full country list; falls back to Kenya (+254) if no match.
 */
function parsePhone(phone: string | null, countryCodes: ReadonlyArray<CountryCodeEntry>): { code: string; national: string } {
  if (!phone || !phone.trim()) {
    return { code: '+254', national: '' };
  }
  const digits = phone.replace(/\D/g, '');
  if (!digits.length) return { code: '+254', national: '' };
  // Sort by code length descending so +254 matches before +25
  const sorted = [...countryCodes].sort((a, b) => b.value.length - a.value.length);
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
  /** Searchable country dropdown: open state and search query */
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const countryListRef = useRef<HTMLUListElement>(null);

  /** Filtered country list for search (all countries, filtered by search string) */
  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return ALL_COUNTRY_CODES;
    // Extract country name from label (everything before the opening parenthesis)
    // Format: "Country Name (+NN)" -> "Country Name"
    const getCountryName = (label: string): string => {
      const match = label.match(/^([^(]+)/);
      return match ? match[1].trim().toLowerCase() : label.toLowerCase();
    };
    // Extract digits from query for code search (only if query contains digits)
    const codeDigits = q.replace(/\D/g, '');
    const filtered = ALL_COUNTRY_CODES.filter((c) => {
      // Primary search: match country name (prioritize this)
      const countryName = getCountryName(c.label);
      if (countryName.includes(q)) {
        return true;
      }
      // Secondary search: match country code only if query contains digits
      if (codeDigits.length > 0 && c.value.includes(codeDigits)) {
        return true;
      }
      return false;
    });
    console.log('[Profile] Filtering countries:', { query: q, total: ALL_COUNTRY_CODES.length, filtered: filtered.length, first5: filtered.slice(0, 5).map(c => c.label) });
    return filtered;
  }, [countrySearch]);

  /** Selected country label for display */
  const selectedCountryLabel =
    ALL_COUNTRY_CODES.find((c) => c.value === form.phoneCountryCode)?.label ?? form.phoneCountryCode;

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('[Profile] No auth token found');
      router.push('/admin/login');
      return;
    }
    try {
      console.log('[Profile] Fetching profile...');
      const res = await fetch('/api/v1/admin/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[Profile] Response status:', res.status);
      if (res.status === 401) {
        console.error('[Profile] Unauthorized - redirecting to login');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin');
        router.push('/admin/login');
        return;
      }
      if (!res.ok) {
        const errorText = await res.text();
        console.error('[Profile] Profile fetch failed:', res.status, errorText);
        setProfile(null);
        return;
      }
      const data: AdminProfile = await res.json();
      console.log('[Profile] Profile loaded:', data.email);
      setProfile(data);
      const { code, national } = parsePhone(data.phone ?? null, ALL_COUNTRY_CODES);
      setForm({
        displayName: data.displayName ?? '',
        phoneCountryCode: code,
        phoneNational: national,
        organization: data.organization ?? '',
      });
    } catch (error) {
      console.error('[Profile] Error fetching profile:', error);
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

  /** Close country dropdown when clicking outside */
  useEffect(() => {
    if (!countryDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [countryDropdownOpen]);

  /** Scroll country list to top when search changes */
  useEffect(() => {
    if (countryListRef.current) {
      countryListRef.current.scrollTop = 0;
    }
  }, [countrySearch]);

  const handleStartEdit = () => {
    if (profile) {
      const { code, national } = parsePhone(profile.phone ?? null, ALL_COUNTRY_CODES);
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

                {/* Phone (country code + national number) — searchable country list */}
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-2">Phone</label>
                  {editing ? (
                    <div className="flex gap-2 max-w-md" ref={countryDropdownRef}>
                      {/* Searchable country combobox: trigger shows selected; dropdown has search + list */}
                      <div className="relative min-w-[180px]">
                        <button
                          type="button"
                          onClick={() => {
                            setCountryDropdownOpen((o) => !o);
                            setCountrySearch('');
                          }}
                          className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-left text-[#0F172A] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent bg-white flex items-center justify-between"
                          aria-label="Country code"
                          aria-expanded={countryDropdownOpen}
                          aria-haspopup="listbox"
                        >
                          <span className="truncate">{selectedCountryLabel}</span>
                          <svg className="w-4 h-4 text-[#64748B] shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={countryDropdownOpen ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                          </svg>
                        </button>
                        {countryDropdownOpen && (
                          <div
                            className="absolute z-10 mt-1 w-full max-h-[280px] flex flex-col rounded-lg border border-[#E2E8F0] bg-white shadow-lg"
                            role="listbox"
                          >
                            <input
                              type="text"
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              placeholder="Search countries..."
                              className="mx-2 mt-2 px-3 py-2 border border-[#E2E8F0] rounded-md text-sm text-[#0F172A] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                              aria-label="Search countries"
                              autoFocus
                            />
                            <ul ref={countryListRef} className="overflow-y-auto py-2 max-h-[220px]" aria-label="Country list">
                              {filteredCountries.length === 0 ? (
                                <li className="px-4 py-2 text-sm text-[#64748B]">No countries match</li>
                              ) : (
                                filteredCountries.map((c, idx) => (
                                  <li
                                    key={`${c.value}-${c.label}-${idx}`}
                                    role="option"
                                    aria-selected={form.phoneCountryCode === c.value}
                                    onClick={() => {
                                      setForm((f) => ({ ...f, phoneCountryCode: c.value }));
                                      setCountryDropdownOpen(false);
                                      setCountrySearch('');
                                    }}
                                    className={`px-4 py-2 text-sm cursor-pointer ${
                                      form.phoneCountryCode === c.value
                                        ? 'bg-[#6366F1] text-white'
                                        : 'text-[#0F172A] hover:bg-[#F1F5F9]'
                                    }`}
                                  >
                                    {c.label}
                                  </li>
                                ))
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
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
