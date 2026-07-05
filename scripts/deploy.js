#!/usr/bin/env node

/**
 * QuestXLM Deployment Script
 * 
 * Production-ready deployment script for Soroban contracts with
 * comprehensive error handling, verification, and network management.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

class QuestXLMDeployer {
  constructor() {
    this.networkConfig = {
      testnet: {
        networkPassphrase: 'Test SDF Network ; September 2015',
        horizonUrl: 'https://horizon-testnet.stellar.org',
        sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
        friendbotUrl: 'https://friendbot.stellar.org'
      },
      mainnet: {
        networkPassphrase: 'Public Global Stellar Network ; September 2015',
        horizonUrl: 'https://horizon.stellar.org',
        sorobanRpcUrl: 'https://soroban-mainnet.stellar.org'
      }
    };
    
    this.deploymentState = {
      network: null,
      adminKeypair: null,
      oracleKeypair: null,
      contracts: {},
      deploymentTime: null
    };
  }

  /**
   * Main deployment function
   */
  async deploy() {
    try {
      console.log('🚀 Starting QuestXLM Protocol deployment...\n');

      // Parse command line arguments
      const args = this.parseArguments();
      this.deploymentState.network = args.network;

      // Validate prerequisites
      await this.validatePrerequisites();

      // Setup accounts
      await this.setupAccounts(args);

      // Build contracts
      await this.buildContracts();

      // Deploy contracts
      await this.deployContracts();

      // Initialize contracts
      await this.initializeContracts();

      // Verify deployment
      await this.verifyDeployment();

      // Save deployment info
      await this.saveDeploymentInfo();

      console.log('✅ QuestXLM Protocol deployed successfully!');
      console.log(`\n📋 Deployment Summary:`);
      console.log(`Network: ${this.deploymentState.network}`);
      console.log(`Admin Address: ${this.deploymentState.adminKeypair.publicKey()}`);
      console.log(`Oracle Address: ${this.deploymentState.oracleKeypair.publicKey()}`);
      console.log(`Contract ID: ${this.deploymentState.contracts.questProtocol}`);
      console.log(`Deployment Time: ${this.deploymentState.deploymentTime}`);

    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Parse command line arguments
   */
  parseArguments() {
    const args = process.argv.slice(2);
    const network = args.includes('--mainnet') ? 'mainnet' : 'testnet';
    const skipBuild = args.includes('--skip-build');
    const skipInit = args.includes('--skip-init');
    const adminSecret = args.find(arg => arg.startsWith('--admin-secret='))?.split('=')[1];
    const oracleSecret = args.find(arg => arg.startsWith('--oracle-secret='))?.split('=')[1];

    if (network === 'mainnet' && (!adminSecret || !oracleSecret)) {
      throw new Error('Admin and oracle secret keys are required for mainnet deployment');
    }

    return {
      network,
      skipBuild,
      skipInit,
      adminSecret,
      oracleSecret
    };
  }

  /**
   * Validate deployment prerequisites
   */
  async validatePrerequisites() {
    console.log('🔍 Validating prerequisites...');

    // Check if stellar CLI is installed
    try {
      execSync('stellar --version', { stdio: 'pipe' });
      console.log('✓ Stellar CLI found');
    } catch (error) {
      throw new Error('Stellar CLI not found. Please install it first.');
    }

    // Check if Rust and cargo are installed
    try {
      execSync('cargo --version', { stdio: 'pipe' });
      console.log('✓ Cargo found');
    } catch (error) {
      throw new Error('Cargo not found. Please install Rust and Cargo.');
    }

    // Check wasm32 target
    try {
      const targets = execSync('rustup target list --installed', { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
      if (!targets.includes('wasm32-unknown-unknown')) {
        console.log('📦 Installing wasm32-unknown-unknown target...');
        execSync('rustup target add wasm32-unknown-unknown');
      }
      console.log('✓ WASM target available');
    } catch (error) {
      throw new Error('Failed to check or install WASM target');
    }

    // Check contract directory
    const contractPath = resolve(PROJECT_ROOT, 'contract');
    if (!existsSync(contractPath)) {
      throw new Error('Contract directory not found');
    }
    console.log('✓ Contract source found');

    console.log('✅ Prerequisites validated\n');
  }

  /**
   * Setup deployment accounts
   */
  async setupAccounts(args) {
    console.log('👤 Setting up accounts...');

    const { Keypair } = await import('@stellar/stellar-sdk');

    // Setup admin account
    if (args.adminSecret) {
      this.deploymentState.adminKeypair = Keypair.fromSecret(args.adminSecret);
    } else {
      this.deploymentState.adminKeypair = Keypair.random();
      console.log('⚠️  Generated random admin keypair for testnet');
    }

    // Setup oracle account
    if (args.oracleSecret) {
      this.deploymentState.oracleKeypair = Keypair.fromSecret(args.oracleSecret);
    } else {
      this.deploymentState.oracleKeypair = Keypair.random();
      console.log('⚠️  Generated random oracle keypair for testnet');
    }

    // Fund accounts on testnet
    if (this.deploymentState.network === 'testnet') {
      await this.fundTestnetAccount(this.deploymentState.adminKeypair.publicKey());
      await this.fundTestnetAccount(this.deploymentState.oracleKeypair.publicKey());
    }

    console.log(`✓ Admin account: ${this.deploymentState.adminKeypair.publicKey()}`);
    console.log(`✓ Oracle account: ${this.deploymentState.oracleKeypair.publicKey()}`);
    console.log('✅ Accounts setup complete\n');
  }

  /**
   * Fund testnet account using friendbot
   */
  async fundTestnetAccount(publicKey) {
    try {
      console.log(`💰 Funding testnet account: ${publicKey}`);
      
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${publicKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fund account: ${response.statusText}`);
      }

      console.log(`✓ Account funded: ${publicKey}`);
    } catch (error) {
      console.warn(`⚠️  Warning: Could not fund account ${publicKey}: ${error.message}`);
    }
  }

  /**
   * Build smart contracts
   */
  async buildContracts() {
    console.log('🔨 Building contracts...');

    const contractPath = resolve(PROJECT_ROOT, 'contract');

    try {
      // Clean previous build
      execSync('cargo clean', { 
        cwd: contractPath, 
        stdio: 'pipe' 
      });

      // Build optimized contract
      execSync('cargo build --target wasm32-unknown-unknown --release', {
        cwd: contractPath,
        stdio: 'inherit'
      });

      // Verify WASM file exists
      const wasmPath = resolve(
        contractPath, 
        'target/wasm32-unknown-unknown/release/quest_xlm_protocol.wasm'
      );
      
      if (!existsSync(wasmPath)) {
        throw new Error('WASM file not found after build');
      }

      console.log('✅ Contracts built successfully\n');
    } catch (error) {
      throw new Error(`Contract build failed: ${error.message}`);
    }
  }

  /**
   * Deploy contracts to Soroban
   */
  async deployContracts() {
    console.log('📤 Deploying contracts...');

    const contractPath = resolve(PROJECT_ROOT, 'contract');
    const wasmPath = resolve(
      contractPath,
      'target/wasm32-unknown-unknown/release/quest_xlm_protocol.wasm'
    );

    try {
      // Deploy main protocol contract
      console.log('Deploying QuestXLM Protocol contract...');
      
      const deployResult = execSync(
        `stellar contract deploy \\
          --wasm ${wasmPath} \\
          --source ${this.deploymentState.adminKeypair.secret()} \\
          --network ${this.deploymentState.network}`,
        { encoding: 'utf8', stdio: 'pipe' }
      );

      const contractId = deployResult.trim();
      this.deploymentState.contracts.questProtocol = contractId;

      console.log(`✓ Protocol contract deployed: ${contractId}`);
      console.log('✅ Contract deployment complete\n');

    } catch (error) {
      throw new Error(`Contract deployment failed: ${error.message}`);
    }
  }

  /**
   * Initialize deployed contracts
   */
  async initializeContracts() {
    console.log('⚙️  Initializing contracts...');

    try {
      const contractId = this.deploymentState.contracts.questProtocol;
      const adminAddress = this.deploymentState.adminKeypair.publicKey();
      const oracleAddress = this.deploymentState.oracleKeypair.publicKey();

      // Initialize the protocol contract
      const initResult = execSync(
        `stellar contract invoke \\
          --id ${contractId} \\
          --source ${this.deploymentState.adminKeypair.secret()} \\
          --network ${this.deploymentState.network} \\
          -- \\
          initialize \\
          --admin ${adminAddress} \\
          --oracle ${oracleAddress} \\
          --config '{"min_cooldown": 300, "max_cooldown": 86400, "initial_reputation": 100, "min_reward": "1000000", "max_reward": "100000000", "creator_share": 10, "oracle_fee": 5, "cheat_threshold": 3}'`,
        { encoding: 'utf8', stdio: 'pipe' }
      );

      console.log('✓ Protocol contract initialized');

      // Fund the treasury with initial amount
      if (this.deploymentState.network === 'testnet') {
        console.log('💰 Funding treasury with test XLM...');
        
        const fundResult = execSync(
          `stellar contract invoke \\
            --id ${contractId} \\
            --source ${this.deploymentState.adminKeypair.secret()} \\
            --network ${this.deploymentState.network} \\
            -- \\
            fund_treasury \\
            --amount "1000000000"`,
          { encoding: 'utf8', stdio: 'pipe' }
        );

        console.log('✓ Treasury funded with 100 XLM');
      }

      console.log('✅ Contract initialization complete\n');

    } catch (error) {
      throw new Error(`Contract initialization failed: ${error.message}`);
    }
  }

  /**
   * Verify deployment by testing basic functions
   */
  async verifyDeployment() {
    console.log('✅ Verifying deployment...');

    try {
      const contractId = this.deploymentState.contracts.questProtocol;

      // Test: Get protocol configuration
      const configResult = execSync(
        `stellar contract invoke \\
          --id ${contractId} \\
          --source ${this.deploymentState.adminKeypair.secret()} \\
          --network ${this.deploymentState.network} \\
          -- \\
          get_config`,
        { encoding: 'utf8', stdio: 'pipe' }
      );

      const config = JSON.parse(configResult);
      console.log('✓ Protocol configuration retrieved');

      // Test: Get treasury balance
      const balanceResult = execSync(
        `stellar contract invoke \\
          --id ${contractId} \\
          --source ${this.deploymentState.adminKeypair.secret()} \\
          --network ${this.deploymentState.network} \\
          -- \\
          get_treasury_balance`,
        { encoding: 'utf8', stdio: 'pipe' }
      );

      console.log(`✓ Treasury balance: ${balanceResult.trim()}`);

      // Test: Get module count
      const moduleCountResult = execSync(
        `stellar contract invoke \\
          --id ${contractId} \\
          --source ${this.deploymentState.adminKeypair.secret()} \\
          --network ${this.deploymentState.network} \\
          -- \\
          get_module_count`,
        { encoding: 'utf8', stdio: 'pipe' }
      );

      console.log(`✓ Module count: ${moduleCountResult.trim()}`);
      console.log('✅ Deployment verification complete\n');

    } catch (error) {
      throw new Error(`Deployment verification failed: ${error.message}`);
    }
  }

  /**
   * Save deployment information to file
   */
  async saveDeploymentInfo() {
    console.log('💾 Saving deployment information...');

    const deploymentInfo = {
      network: this.deploymentState.network,
      deploymentTime: new Date().toISOString(),
      contracts: {
        questProtocol: this.deploymentState.contracts.questProtocol
      },
      accounts: {
        admin: this.deploymentState.adminKeypair.publicKey(),
        oracle: this.deploymentState.oracleKeypair.publicKey()
      },
      networkConfig: this.networkConfig[this.deploymentState.network]
    };

    const deploymentPath = resolve(PROJECT_ROOT, `deployment-${this.deploymentState.network}.json`);
    writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    // Save environment variables template
    const envContent = `# QuestXLM ${this.deploymentState.network.toUpperCase()} Configuration
NEXT_PUBLIC_NETWORK=${this.deploymentState.network.toUpperCase()}
NEXT_PUBLIC_${this.deploymentState.network.toUpperCase()}_CONTRACT_ID=${this.deploymentState.contracts.questProtocol}
NEXT_PUBLIC_ORACLE_URL=http://localhost:3001

# Oracle Configuration
ORACLE_SECRET=${this.deploymentState.oracleKeypair.secret()}
CONTRACT_ID=${this.deploymentState.contracts.questProtocol}
ADMIN_SECRET=${this.deploymentState.adminKeypair.secret()}

# Network URLs
SOROBAN_RPC_URL=${this.networkConfig[this.deploymentState.network].sorobanRpcUrl}
HORIZON_URL=${this.networkConfig[this.deploymentState.network].horizonUrl}
`;

    const envPath = resolve(PROJECT_ROOT, `.env.${this.deploymentState.network}`);
    writeFileSync(envPath, envContent);

    console.log(`✓ Deployment info saved to: ${deploymentPath}`);
    console.log(`✓ Environment variables saved to: ${envPath}`);
    console.log('✅ Deployment information saved\n');

    this.deploymentState.deploymentTime = deploymentInfo.deploymentTime;
  }
}

// Run deployment if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const deployer = new QuestXLMDeployer();
  deployer.deploy();
}

export default QuestXLMDeployer;