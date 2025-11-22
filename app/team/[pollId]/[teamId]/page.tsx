'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Public team details page for voters
 * Accessible via voting token
 */
export default function PublicTeamDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const pollId = params?.pollId as string;
  const teamId = params?.teamId as string;
  const token = searchParams?.get('token');

  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!pollId || !teamId || !token) {
      setError('Missing required parameters');
      setLoading(false);
      return;
    }

    fetchTeamDetails();
  }, [pollId, teamId, token]);

  const fetchTeamDetails = async () => {
    if (!token) return;

    try {
      // Fetch team details directly - the API will validate the token
      const response = await fetch(`/api/v1/public/polls/${pollId}/teams/${teamId}?token=${encodeURIComponent(token)}`);

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to load team details');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setTeam(data.team);
      setMembers(data.voters || []);
      setIsAuthorized(true);
    } catch (error) {
      console.error('Failed to fetch team details:', error);
      setError('Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e40af] via-[#0891b2] to-[#059669] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading team details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e40af] via-[#0891b2] to-[#059669] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-[#0f172a] mb-2">Access Denied</h2>
            <p className="text-[#64748b] mb-4">{error}</p>
            {token && (
              <Link 
                href={`/vote?token=${encodeURIComponent(token)}`}
                className="inline-block bg-[#1e40af] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#1e3a8a] transition-colors"
              >
                Return to Voting Page
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized || !team) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e40af] via-[#0891b2] to-[#059669] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1e40af] mb-2">
              FAIR Voting Portal
            </h1>
            <p className="text-[#64748b]">Team Details</p>
          </div>

          <div className="mb-6">
            <Link 
              href={`/vote?token=${encodeURIComponent(token || '')}`}
              className="text-[#1e40af] hover:underline inline-flex items-center gap-2 text-sm"
            >
              ← Back to Voting
            </Link>
          </div>

          <div className="mb-6 pb-6 border-b border-[#e2e8f0]">
            <h2 className="text-2xl font-bold text-[#0f172a] mb-2">{team.team_name}</h2>
            <p className="text-[#64748b]">{members.length} member(s) registered</p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Project Information</h3>
            <div className="space-y-4">
              {team.project_name ? (
                <div className="p-3 bg-[#f8fafc] rounded border border-[#e2e8f0]">
                  <span className="text-sm font-semibold text-[#0f172a]">Project Name: </span>
                  <span className="text-sm text-[#64748b]">{team.project_name}</span>
                </div>
              ) : (
                <p className="text-[#94a3b8] italic text-sm">Not provided</p>
              )}

              {team.project_description ? (
                <div className="p-3 bg-[#f8fafc] rounded border border-[#e2e8f0]">
                  <span className="text-sm font-semibold text-[#0f172a] block mb-1">Description: </span>
                  <p className="text-sm text-[#64748b] whitespace-pre-wrap">{team.project_description}</p>
                </div>
              ) : (
                <p className="text-[#94a3b8] italic text-sm">Not provided</p>
              )}

              {team.pitch ? (
                <div className="p-3 bg-[#f8fafc] rounded border border-[#e2e8f0]">
                  <span className="text-sm font-semibold text-[#0f172a] block mb-1">Pitch: </span>
                  <p className="text-sm text-[#64748b] whitespace-pre-wrap">{team.pitch}</p>
                </div>
              ) : (
                <p className="text-[#94a3b8] italic text-sm">Not provided</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {team.live_site_url ? (
                  <div className="p-3 bg-[#f8fafc] rounded border border-[#e2e8f0]">
                    <a 
                      href={team.live_site_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-[#0891b2] hover:underline"
                    >
                      🔗 Live Site
                    </a>
                  </div>
                ) : (
                  <p className="text-[#94a3b8] italic text-sm">Not provided</p>
                )}

                {team.github_url ? (
                  <div className="p-3 bg-[#f8fafc] rounded border border-[#e2e8f0]">
                    <a 
                      href={team.github_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-[#0891b2] hover:underline"
                    >
                      💻 GitHub
                    </a>
                  </div>
                ) : (
                  <p className="text-[#94a3b8] italic text-sm">Not provided</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#e2e8f0]">
            <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Team Members ({members.length})</h3>
            <div className="space-y-2">
              {members.length === 0 ? (
                <p className="text-[#64748b] text-center py-4">No members registered</p>
              ) : (
                members.map((member: any) => (
                  <div key={member.tokenId} className="p-3 border border-[#e2e8f0] rounded-lg bg-[#f8fafc]">
                    <div>
                      <p className="font-medium text-[#0f172a] text-sm">{member.email}</p>
                      <div className="mt-2 flex gap-4 text-xs">
                        <span className={`font-medium ${member.used ? 'text-[#059669]' : 'text-[#dc2626]'}`}>
                          Status: {member.used ? 'Voted' : 'Not Voted'}
                        </span>
                        <span className="text-[#64748b]">
                          Registered: {new Date(member.issuedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

