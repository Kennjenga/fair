'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui';

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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading team details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          {token && (
            <Link
              href={`/vote?token=${encodeURIComponent(token)}`}
              className="inline-block bg-[#4F46E5] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#4338CA] transition-colors"
            >
              Return to Voting Page
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthorized || !team) {
    return null;
  }

  const hasProjectDetails = !!(team.project_name || team.project_description || team.pitch || team.live_site_url || team.github_url);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Main card - matches submit and vote layout */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header block */}
          <div className="p-6 border-b border-gray-200">
            <Link
              href={`/vote?token=${encodeURIComponent(token || '')}`}
              className="text-[#4F46E5] hover:text-[#4338CA] font-medium text-sm inline-flex items-center gap-1 mb-4"
            >
              ← Back to Voting
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{team.team_name}</h1>
            <p className="text-sm text-gray-500 mt-1">{members.length} member(s) registered</p>
          </div>

          {/* Project Information - single organized section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h2>
            {hasProjectDetails ? (
              <div className="space-y-4">
                {team.project_name && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Project Name</span>
                    <p className="text-gray-900 font-medium mt-0.5">{team.project_name}</p>
                  </div>
                )}
                {team.project_description && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</span>
                    <p className="text-gray-700 text-sm mt-0.5 whitespace-pre-wrap">{team.project_description}</p>
                  </div>
                )}
                {team.pitch && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pitch</span>
                    <p className="text-gray-700 text-sm mt-0.5 whitespace-pre-wrap">{team.pitch}</p>
                  </div>
                )}
                {(team.live_site_url || team.github_url) && (
                  <div className="flex flex-wrap gap-4 pt-1">
                    {team.live_site_url && (
                      <a
                        href={team.live_site_url.startsWith('http') ? team.live_site_url : `https://${team.live_site_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[#4F46E5] hover:underline"
                      >
                        Live site →
                      </a>
                    )}
                    {team.github_url && (
                      <a
                        href={team.github_url.startsWith('http') ? team.github_url : `https://${team.github_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[#4F46E5] hover:underline"
                      >
                        GitHub →
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No project details submitted yet.</p>
            )}
          </div>

          {/* Team Members - same card style as rest of app */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Members ({members.length})</h2>
            {members.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No members registered</p>
            ) : (
              <div className="space-y-3">
                {members.map((member: any) => (
                  <div
                    key={member.tokenId}
                    className="p-4 rounded-xl border border-gray-200 bg-gray-50/50"
                  >
                    <p className="font-medium text-gray-900 text-sm">{member.email}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs">
                      <span className={member.used ? 'text-[#059669] font-medium' : 'text-red-600 font-medium'}>
                        Status: {member.used ? 'Voted' : 'Not Voted'}
                      </span>
                      <span className="text-gray-500">
                        Registered: {new Date(member.issuedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

