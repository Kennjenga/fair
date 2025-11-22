'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui';

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
      // First validate the token and check if user belongs to this team
      const validateResponse = await fetch(`/api/v1/vote/validate?token=${encodeURIComponent(token)}`);
      
      if (!validateResponse.ok) {
        setError('Invalid or expired token');
        setLoading(false);
        return;
      }

      const validateData = await validateResponse.json();
      
      // Check if the token's team matches the requested team
      // The validate endpoint returns voterTeam with team_id
      const tokenTeamId = validateData.voterTeam?.teamId || validateData.voterTeam?.team_id;
      if (tokenTeamId !== teamId) {
        setError('You do not have access to view this team');
        setLoading(false);
        return;
      }

      setIsAuthorized(true);

      // Fetch team details
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4F46E5] mx-auto mb-4"></div>
          <p className="text-[#64748B]">Loading team details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-[#0F172A] mb-2">Access Denied</h2>
            <p className="text-[#64748B] mb-4">{error}</p>
            <Link 
              href={`/vote?token=${encodeURIComponent(token || '')}`}
              className="text-[#4F46E5] hover:underline"
            >
              Return to Voting Page
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (!isAuthorized || !team) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link 
            href={`/vote?token=${encodeURIComponent(token || '')}`}
            className="text-[#4F46E5] hover:underline inline-flex items-center gap-2"
          >
            ← Back to Voting
          </Link>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#0F172A] mb-2">{team.team_name}</h1>
              <p className="text-[#64748B]">{members.length} member(s) registered</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#0F172A] mb-4">Project Information</h2>
          <div className="space-y-4">
            {team.project_name ? (
              <div>
                <h3 className="text-sm font-medium text-[#0F172A] mb-1">Project Name</h3>
                <p className="text-[#334155]">{team.project_name}</p>
              </div>
            ) : (
              <p className="text-[#94A3B8] italic">Not provided</p>
            )}

            {team.project_description ? (
              <div>
                <h3 className="text-sm font-medium text-[#0F172A] mb-1">Project Description</h3>
                <p className="text-[#334155] whitespace-pre-wrap">{team.project_description}</p>
              </div>
            ) : (
              <p className="text-[#94A3B8] italic">Not provided</p>
            )}

            {team.pitch ? (
              <div>
                <h3 className="text-sm font-medium text-[#0F172A] mb-1">Pitch</h3>
                <p className="text-[#334155] whitespace-pre-wrap">{team.pitch}</p>
              </div>
            ) : (
              <p className="text-[#94A3B8] italic">Not provided</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {team.live_site_url ? (
                <div>
                  <h3 className="text-sm font-medium text-[#0F172A] mb-1">Live Site</h3>
                  <a 
                    href={team.live_site_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#0891b2] hover:underline break-all"
                  >
                    {team.live_site_url}
                  </a>
                </div>
              ) : (
                <p className="text-[#94A3B8] italic">Not provided</p>
              )}

              {team.github_url ? (
                <div>
                  <h3 className="text-sm font-medium text-[#0F172A] mb-1">GitHub Repository</h3>
                  <a 
                    href={team.github_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#0891b2] hover:underline break-all"
                  >
                    {team.github_url}
                  </a>
                </div>
              ) : (
                <p className="text-[#94A3B8] italic">Not provided</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-[#0F172A] mb-4">Team Members ({members.length})</h2>
          <div className="space-y-3">
            {members.length === 0 ? (
              <p className="text-[#64748B] text-center py-4">No members registered</p>
            ) : (
              members.map((member: any) => (
                <div key={member.tokenId} className="p-4 border border-[#E2E8F0] rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-[#0F172A]">{member.email}</p>
                      <div className="mt-2 flex gap-4 text-sm">
                        <span className={`font-medium ${member.used ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                          Status: {member.used ? 'Voted' : 'Not Voted'}
                        </span>
                        <span className="text-[#64748B]">
                          Registered: {new Date(member.issuedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

