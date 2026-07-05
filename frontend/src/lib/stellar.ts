/**
 * Stellar and Soroban SDK integration utilities
 */

import {
  StellarSdk,
  Networks,
  Server,
  Keypair,
  Asset,
  Operation,
  TransactionBuilder,
  Contract,
  SorobanRpc,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import { NETWORK_CONFIG, CONTRACT_ADDRESSES, DEFAULT_CONFIG } from './constants';
import { QuestXLMError } from '@/types';

// Initialize Stellar SDK
const isTestnet = DEFAULT_CONFIG.NETWORK === 'TESTNET';
const networkConfig = isTestnet ? NETWORK_CONFIG.TESTNET : NETWORK_CONFIG.MAINNET;
const contractAddress = isTestnet ? 
  CONTRACT_ADDRESSES.TESTNET.QUEST_PROTOCOL : 
  CONTRACT_ADDRESSES.MAINNET.QUEST_PROTOCOL;

// Server instances
export const horizonServer = new Server(networkConfig.horizonUrl);
export const sorobanServer = new SorobanRpc.Server(networkConfig.sorobanRpcUrl);

// Network configuration
export const networkPassphrase = networkConfig.networkPassphrase;

/**
 * Contract interaction class for QuestXLM Protocol
 */
export class QuestXLMContract {
  private contract: Contract;
  private server: SorobanRpc.Server;

  constructor(contractId: string = contractAddress) {
    if (!contractId) {
      throw new QuestXLMError('Contract ID not provided', 'CONTRACT_NOT_FOUND');
    }

    this.contract = new Contract(contractId);
    this.server = sorobanServer;
  }

  /**
   * Get the contract instance
   */
  getContract(): Contract {
    return this.contract;
  }

  /**
   * Simulate a contract call without submitting to the network
   */
  async simulate(
    method: string,
    args: any[] = [],
    caller?: string
  ): Promise<any> {
    try {
      const account = caller ? 
        await horizonServer.loadAccount(caller) :
        await this.getTemporaryAccount();

      const operation = this.contract.call(method, ...args);
      
      const transaction = new TransactionBuilder(account, {
        fee: '100000',
        networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(DEFAULT_CONFIG.TRANSACTION_TIMEOUT)
        .build();

      const result = await this.server.simulateTransaction(transaction);
      
      if (SorobanRpc.Api.isSimulationSuccess(result)) {
        return result.result?.retval ? scValToNative(result.result.retval) : null;
      } else {
        throw new QuestXLMError(
          `Simulation failed: ${result.error || 'Unknown error'}`,
          'SIMULATION_FAILED',
          result
        );
      }
    } catch (error) {
      if (error instanceof QuestXLMError) throw error;
      throw new QuestXLMError(
        `Failed to simulate contract call: ${error}`,
        'NETWORK_ERROR',
        error
      );
    }
  }

  /**
   * Execute a contract method that requires authentication
   */
  async call(
    method: string,
    args: any[] = [],
    userPublicKey: string,
    options: { fee?: string; memo?: string } = {}
  ): Promise<{ hash: string; result?: any }> {
    try {
      const userKeypair = Keypair.fromPublicKey(userPublicKey);
      const account = await horizonServer.loadAccount(userKeypair.publicKey());
      
      const operation = this.contract.call(method, ...args);
      
      const transaction = new TransactionBuilder(account, {
        fee: options.fee || '1000000',
        networkPassphrase,
        memo: options.memo,
      })
        .addOperation(operation)
        .setTimeout(DEFAULT_CONFIG.TRANSACTION_TIMEOUT)
        .build();

      // This would need to be signed by the user's wallet
      // The actual signing happens in the wallet integration
      return { hash: '', result: null };
    } catch (error) {
      throw new QuestXLMError(
        `Failed to execute contract call: ${error}`,
        'TRANSACTION_FAILED',
        error
      );
    }
  }

  /**
   * Get a temporary account for simulation purposes
   */
  private async getTemporaryAccount() {
    const keypair = Keypair.random();
    return new StellarSdk.Account(keypair.publicKey(), '0');
  }

  // Contract method wrappers

  /**
   * Get module information
   */
  async getModule(moduleId: number): Promise<any> {
    return this.simulate('get_module', [nativeToScVal(moduleId, { type: 'u32' })]);
  }

  /**
   * Get user progress
   */
  async getUserProgress(userAddress: string): Promise<any> {
    return this.simulate('get_user_progress', [
      nativeToScVal(Address.fromString(userAddress), { type: 'address' })
    ]);
  }

  /**
   * Get user reputation
   */
  async getUserReputation(userAddress: string): Promise<any> {
    return this.simulate('get_user_reputation', [
      nativeToScVal(Address.fromString(userAddress), { type: 'address' })
    ]);
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 50): Promise<any> {
    return this.simulate('get_leaderboard', [
      nativeToScVal(limit, { type: 'u32' })
    ]);
  }

  /**
   * Get treasury balance
   */
  async getTreasuryBalance(): Promise<string> {
    const result = await this.simulate('get_treasury_balance');
    return result?.toString() || '0';
  }

  /**
   * Get module count
   */
  async getModuleCount(): Promise<number> {
    return this.simulate('get_module_count');
  }

  /**
   * Get protocol configuration
   */
  async getConfig(): Promise<any> {
    return this.simulate('get_config');
  }

  /**
   * Get modules by category
   */
  async getModulesByCategory(category: string, limit: number = 10): Promise<number[]> {
    return this.simulate('get_modules_by_category', [
      nativeToScVal(category, { type: 'string' }),
      nativeToScVal(limit, { type: 'u32' })
    ]);
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(userAddress: string): Promise<number[]> {
    return this.simulate('get_user_achievements', [
      nativeToScVal(Address.fromString(userAddress), { type: 'address' })
    ]);
  }

  /**
   * Get batch of modules
   */
  async getModulesBatch(startId: number, limit: number): Promise<any[]> {
    return this.simulate('get_modules_batch', [
      nativeToScVal(startId, { type: 'u32' }),
      nativeToScVal(limit, { type: 'u32' })
    ]);
  }

  // Write operations (require user authentication)

  /**
   * Create a new module (requires wallet signature)
   */
  async createModule(
    userPublicKey: string,
    moduleData: {
      contentHash: string;
      quizHash: string;
      rewardAmount: string;
      cooldownPeriod: number;
      difficultyLevel: number;
      minReputation: number;
      category: string;
    }
  ): Promise<{ hash: string; moduleId?: number }> {
    const args = [
      nativeToScVal(Address.fromString(userPublicKey), { type: 'address' }),
      nativeToScVal(moduleData.contentHash, { type: 'bytes' }),
      nativeToScVal(moduleData.quizHash, { type: 'bytes' }),
      nativeToScVal(BigInt(moduleData.rewardAmount), { type: 'i128' }),
      nativeToScVal(moduleData.cooldownPeriod, { type: 'u64' }),
      nativeToScVal(moduleData.difficultyLevel, { type: 'u32' }),
      nativeToScVal(moduleData.minReputation, { type: 'u32' }),
      nativeToScVal(moduleData.category, { type: 'string' }),
    ];

    return this.call('create_module', args, userPublicKey);
  }

  /**
   * Submit module completion (requires wallet signature)
   */
  async submitCompletion(
    userPublicKey: string,
    moduleId: number,
    answerHash: string,
    completionTime: number
  ): Promise<{ hash: string }> {
    const args = [
      nativeToScVal(Address.fromString(userPublicKey), { type: 'address' }),
      nativeToScVal(moduleId, { type: 'u32' }),
      nativeToScVal(answerHash, { type: 'bytes' }),
      nativeToScVal(completionTime, { type: 'u64' }),
    ];

    return this.call('submit_completion', args, userPublicKey);
  }

  /**
   * Fund treasury (admin only)
   */
  async fundTreasury(
    adminPublicKey: string,
    amount: string
  ): Promise<{ hash: string }> {
    const args = [
      nativeToScVal(BigInt(amount), { type: 'i128' })
    ];

    return this.call('fund_treasury', args, adminPublicKey);
  }
}

/**
 * Wallet integration utilities
 */
export class WalletManager {
  /**
   * Check if Freighter wallet is available
   */
  static isFreighterAvailable(): boolean {
    return typeof window !== 'undefined' && 'freighter' in window;
  }

  /**
   * Connect to Freighter wallet
   */
  static async connectFreighter(): Promise<{
    publicKey: string;
    address: string;
  }> {
    if (!this.isFreighterAvailable()) {
      throw new QuestXLMError(
        'Freighter wallet not found. Please install Freighter.',
        'WALLET_NOT_FOUND'
      );
    }

    try {
      const { isConnected } = await (window as any).freighter.isConnected();
      
      if (!isConnected) {
        throw new QuestXLMError(
          'Freighter wallet not connected. Please connect your wallet.',
          'WALLET_NOT_CONNECTED'
        );
      }

      const { address } = await (window as any).freighter.getAddress();
      return {
        publicKey: address,
        address: address,
      };
    } catch (error) {
      throw new QuestXLMError(
        `Failed to connect to Freighter: ${error}`,
        'WALLET_CONNECTION_FAILED',
        error
      );
    }
  }

  /**
   * Sign transaction with Freighter
   */
  static async signTransaction(transaction: string): Promise<string> {
    if (!this.isFreighterAvailable()) {
      throw new QuestXLMError(
        'Freighter wallet not available',
        'WALLET_NOT_FOUND'
      );
    }

    try {
      const { signedXDR } = await (window as any).freighter.signTransaction(
        transaction,
        {
          networkPassphrase,
        }
      );
      
      return signedXDR;
    } catch (error) {
      throw new QuestXLMError(
        `Failed to sign transaction: ${error}`,
        'TRANSACTION_SIGNING_FAILED',
        error
      );
    }
  }

  /**
   * Get account balance
   */
  static async getAccountBalance(publicKey: string): Promise<string> {
    try {
      const account = await horizonServer.loadAccount(publicKey);
      const xlmBalance = account.balances.find(
        (balance: any) => balance.asset_type === 'native'
      );
      return xlmBalance?.balance || '0';
    } catch (error) {
      throw new QuestXLMError(
        `Failed to load account balance: ${error}`,
        'ACCOUNT_LOAD_FAILED',
        error
      );
    }
  }
}

/**
 * Utility functions for Stellar operations
 */
export const StellarUtils = {
  /**
   * Convert stroops to XLM
   */
  stroopsToXLM(stroops: string | number): string {
    return (Number(stroops) / 10000000).toFixed(7);
  },

  /**
   * Convert XLM to stroops
   */
  xlmToStroops(xlm: string | number): string {
    return (Number(xlm) * 10000000).toString();
  },

  /**
   * Format XLM amount for display
   */
  formatXLM(stroops: string | number, decimals: number = 2): string {
    const xlm = this.stroopsToXLM(stroops);
    return `${Number(xlm).toFixed(decimals)} XLM`;
  },

  /**
   * Validate Stellar address
   */
  isValidAddress(address: string): boolean {
    try {
      Keypair.fromPublicKey(address);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Generate a random keypair for testing
   */
  generateKeypair(): { publicKey: string; secretKey: string } {
    const keypair = Keypair.random();
    return {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
    };
  },

  /**
   * Create a hash for quiz answers
   */
  createAnswerHash(
    answerText: string,
    learnerAddress: string,
    moduleId: number,
    nonce: string = Date.now().toString()
  ): Promise<string> {
    const message = answerText + learnerAddress + moduleId.toString() + nonce;
    return this.sha256(message);
  },

  /**
   * SHA-256 hash function
   */
  async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },
};

// Export the main contract instance
export const questContract = new QuestXLMContract();