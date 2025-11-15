import Link from 'next/link';

/**
 * Home page - Landing page for FAIR Voting Platform
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e40af] via-[#0891b2] to-[#059669]">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-5xl font-bold mb-6">
            FAIR Voting Platform
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Transparent, tamper-proof voting powered by Avalanche blockchain
          </p>
          <p className="text-lg mb-12 text-blue-50">
            Empowering hackathons and team-based competitions with anonymous, 
            verifiable voting. Every vote is recorded on-chain for complete transparency.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/signup"
              className="bg-white text-[#1e40af] px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Sign Up
            </Link>
            <Link
              href="/admin/login"
              className="bg-[#0891b2] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#0e7490] transition-colors"
            >
              Admin Login
            </Link>
            <Link
              href="/vote"
              className="bg-[#059669] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#047857] transition-colors"
            >
              Cast Your Vote
            </Link>
          </div>
          
          <div className="mt-16 grid md:grid-cols-3 gap-8 text-left">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Transparent</h3>
              <p className="text-blue-50">
                Every vote is recorded on the Avalanche blockchain, 
                providing immutable proof and public verification.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Anonymous</h3>
              <p className="text-blue-50">
                Your vote is private. Only the team you voted for is recorded, 
                never your identity.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Fair</h3>
              <p className="text-blue-50">
                One vote per participant. Self-voting prevention. 
                Tamper-proof results you can trust.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
