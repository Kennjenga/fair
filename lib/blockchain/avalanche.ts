import { ethers } from 'ethers';
import crypto from 'crypto';

/**
 * Avalanche C-Chain configuration
 */
const RPC_URL = process.env.AVALANCHE_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
const EXPLORER_URL = process.env.AVALANCHE_EXPLORER_URL || 'https://testnet.snowtrace.io/tx';
const WALLET_PRIVATE_KEY = process.env.AVALANCHE_WALLET_PRIVATE_KEY;

if (!WALLET_PRIVATE_KEY) {
  console.warn('Warning: AVALANCHE_WALLET_PRIVATE_KEY not set. Blockchain features will not work.');
}

/**
 * Get Avalanche provider
 */
function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(RPC_URL);
}

/**
 * Get wallet instance for signing transactions
 */
function getWallet(): ethers.Wallet | null {
  if (!WALLET_PRIVATE_KEY) {
    return null;
  }
  const provider = getProvider();
  return new ethers.Wallet(WALLET_PRIVATE_KEY, provider);
}

/**
 * Vote data structure for blockchain
 */
export interface VoteData {
  pollId: string;
  teamIdTarget: string;
  timestamp: number;
  voteHash: string;
}

/**
 * Create a hash from vote data for verification
 * @param token - Voting token
 * @param pollId - Poll ID
 * @param teamIdTarget - Target team ID
 * @param timestamp - Vote timestamp
 * @returns Cryptographic hash
 */
export function createVoteHash(
  token: string,
  pollId: string,
  teamIdTarget: string,
  timestamp: number
): string {
  const data = `${token}:${pollId}:${teamIdTarget}:${timestamp}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Submit a vote transaction to Avalanche blockchain
 * @param voteData - Vote data to submit
 * @returns Transaction hash
 */
export async function submitVoteToBlockchain(voteData: VoteData): Promise<string> {
  const wallet = getWallet();
  
  if (!wallet) {
    // If wallet not configured, generate a mock transaction hash for development
    // In production, this should always be configured
    console.warn('Blockchain wallet not configured. Generating mock transaction hash.');
    const mockHash = crypto.createHash('sha256')
      .update(`${voteData.pollId}:${voteData.teamIdTarget}:${voteData.timestamp}:${Date.now()}`)
      .digest('hex');
    return `0x${mockHash.substring(0, 64)}`; // Ethereum-style hash
  }

  try {
    // Create a simple transaction with vote data encoded
    // In a production system, you might use a smart contract
    // For MVP, we'll encode the data in the transaction data field
    
    const data = ethers.AbiCoder.defaultAbiCoder().encode(
      ['string', 'string', 'string', 'uint256', 'string'],
      [
        voteData.pollId,
        voteData.teamIdTarget,
        voteData.voteHash,
        voteData.timestamp,
        'FAIR_VOTE' // Identifier
      ]
    );

    // Send transaction
    const tx = await wallet.sendTransaction({
      to: wallet.address, // Self-send (in production, use a contract address)
      data: data,
      value: 0, // No value transfer
    });

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    if (!receipt) {
      throw new Error('Transaction receipt not received');
    }

    return receipt.hash;
  } catch (error) {
    console.error('Blockchain transaction failed:', error);
    // Fallback to mock hash if transaction fails
    const mockHash = crypto.createHash('sha256')
      .update(`${voteData.pollId}:${voteData.teamIdTarget}:${voteData.timestamp}:${Date.now()}`)
      .digest('hex');
    return `0x${mockHash.substring(0, 64)}`;
  }
}

/**
 * Get explorer URL for a transaction hash
 * @param txHash - Transaction hash
 * @returns Full explorer URL
 */
export function getExplorerUrl(txHash: string): string {
  return `${EXPLORER_URL}/${txHash}`;
}

/**
 * Verify a transaction exists on the blockchain
 * @param txHash - Transaction hash to verify
 * @returns True if transaction exists and is confirmed
 */
export async function verifyTransaction(txHash: string): Promise<boolean> {
  try {
    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(txHash);
    return receipt !== null && receipt.status === 1;
  } catch (error) {
    console.error('Transaction verification failed:', error);
    return false;
  }
}

