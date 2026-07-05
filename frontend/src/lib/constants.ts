/**
 * Application constants for QuestXLM Protocol
 */

// Network configuration
export const NETWORK_CONFIG = {
  TESTNET: {
    networkPassphrase: 'Test SDF Network ; September 2015',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  },
  MAINNET: {
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
    horizonUrl: 'https://horizon.stellar.org',
    sorobanRpcUrl: 'https://soroban-mainnet.stellar.org',
  },
} as const;

// Contract addresses (to be updated with actual deployed addresses)
export const CONTRACT_ADDRESSES = {
  TESTNET: {
    QUEST_PROTOCOL: process.env.NEXT_PUBLIC_TESTNET_CONTRACT_ID || '',
  },
  MAINNET: {
    QUEST_PROTOCOL: process.env.NEXT_PUBLIC_MAINNET_CONTRACT_ID || '',
  },
} as const;

// Default configuration
export const DEFAULT_CONFIG = {
  NETWORK: (process.env.NEXT_PUBLIC_NETWORK as 'TESTNET' | 'MAINNET') || 'TESTNET',
  RPC_TIMEOUT: 30000, // 30 seconds
  TRANSACTION_TIMEOUT: 300, // 5 minutes
  ORACLE_URL: process.env.NEXT_PUBLIC_ORACLE_URL || 'http://localhost:3001',
} as const;

// Module categories with metadata
export const MODULE_CATEGORIES = {
  'stellar-basics': {
    name: 'Stellar Basics',
    description: 'Learn the fundamentals of the Stellar network',
    icon: '⭐',
    color: 'blue',
  },
  'soroban-development': {
    name: 'Soroban Development',
    description: 'Build smart contracts with Soroban',
    icon: '🔧',
    color: 'purple',
  },
  'defi-concepts': {
    name: 'DeFi Concepts',
    description: 'Understand decentralized finance',
    icon: '🏦',
    color: 'green',
  },
  'smart-contracts': {
    name: 'Smart Contracts',
    description: 'Advanced contract development',
    icon: '📜',
    color: 'orange',
  },
  'blockchain-fundamentals': {
    name: 'Blockchain Fundamentals',
    description: 'Core blockchain concepts',
    icon: '⛓️',
    color: 'indigo',
  },
  'web3-integration': {
    name: 'Web3 Integration',
    description: 'Connect applications to blockchain',
    icon: '🌐',
    color: 'teal',
  },
  'security-best-practices': {
    name: 'Security Best Practices',
    description: 'Secure development patterns',
    icon: '🔒',
    color: 'red',
  },
} as const;

// Difficulty levels
export const DIFFICULTY_LEVELS = {
  1: {
    name: 'Beginner',
    description: 'No prior knowledge required',
    color: 'green',
    icon: '🌱',
  },
  2: {
    name: 'Elementary',
    description: 'Basic understanding helpful',
    color: 'blue',
    icon: '📚',
  },
  3: {
    name: 'Intermediate',
    description: 'Some experience recommended',
    color: 'yellow',
    icon: '⚡',
  },
  4: {
    name: 'Advanced',
    description: 'Strong foundation required',
    color: 'orange',
    icon: '🎯',
  },
  5: {
    name: 'Expert',
    description: 'Deep expertise needed',
    color: 'red',
    icon: '🔥',
  },
} as const;

// Badge levels and requirements
export const BADGE_LEVELS = {
  0: {
    name: 'Newcomer',
    description: 'Just getting started',
    color: 'gray',
    icon: '👋',
    requirements: 'Join the platform',
  },
  1: {
    name: 'Learner',
    description: 'First steps in learning',
    color: 'green',
    icon: '🌱',
    requirements: '100-499 reputation points',
  },
  2: {
    name: 'Student',
    description: 'Making steady progress',
    color: 'blue',
    icon: '📚',
    requirements: '500-999 reputation points',
  },
  3: {
    name: 'Scholar',
    description: 'Demonstrated competence',
    color: 'purple',
    icon: '🎓',
    requirements: '1000-2499 reputation points',
  },
  4: {
    name: 'Expert',
    description: 'Advanced knowledge',
    color: 'orange',
    icon: '🏆',
    requirements: '2500-4999 reputation points',
  },
  5: {
    name: 'Master',
    description: 'Elite understanding',
    color: 'gold',
    icon: '👑',
    requirements: '5000+ reputation points',
  },
} as const;

// Achievement definitions
export const ACHIEVEMENTS = {
  1: {
    name: 'First Steps',
    description: 'Complete your first module',
    icon: '🥇',
    category: 'milestone',
    points: 50,
  },
  2: {
    name: 'Dedicated Learner',
    description: 'Complete 10 modules',
    icon: '📖',
    category: 'milestone',
    points: 200,
  },
  3: {
    name: 'Streak Master',
    description: 'Maintain a 7-day learning streak',
    icon: '🔥',
    category: 'consistency',
    points: 300,
  },
  4: {
    name: 'Reputation Builder',
    description: 'Reach 1000 reputation points',
    icon: '⭐',
    category: 'reputation',
    points: 500,
  },
  5: {
    name: 'Speed Runner',
    description: 'Complete a module in record time',
    icon: '⚡',
    category: 'performance',
    points: 150,
  },
  6: {
    name: 'Perfect Score',
    description: 'Get 100% on 5 quizzes',
    icon: '💯',
    category: 'performance',
    points: 250,
  },
  7: {
    name: 'Category Expert',
    description: 'Complete all modules in a category',
    icon: '🎯',
    category: 'completion',
    points: 400,
  },
  8: {
    name: 'Community Contributor',
    description: 'Create your first module',
    icon: '🤝',
    category: 'creation',
    points: 300,
  },
  9: {
    name: 'Popular Creator',
    description: 'Your module gets 100 completions',
    icon: '🌟',
    category: 'creation',
    points: 600,
  },
  10: {
    name: 'QuestXLM Ambassador',
    description: 'Refer 10 new learners',
    icon: '🚀',
    category: 'community',
    points: 500,
  },
} as const;

// Error codes and messages
export const ERROR_CODES = {
  // Smart contract errors
  UNAUTHORIZED: 'Unauthorized access',
  MODULE_NOT_FOUND: 'Module not found',
  INSUFFICIENT_REPUTATION: 'Insufficient reputation to access this module',
  COOLDOWN_ACTIVE: 'Must wait before retrying this module',
  INVALID_ANSWER: 'Invalid answer provided',
  INSUFFICIENT_TREASURY: 'Insufficient treasury funds',
  CONTRACT_PAUSED: 'Contract is currently paused',
  
  // Frontend errors
  WALLET_NOT_CONNECTED: 'Please connect your wallet',
  NETWORK_ERROR: 'Network connection error',
  TRANSACTION_FAILED: 'Transaction failed to submit',
  INVALID_INPUT: 'Invalid input provided',
  QUOTA_EXCEEDED: 'Rate limit exceeded',
} as const;

// UI Configuration
export const UI_CONFIG = {
  ITEMS_PER_PAGE: 12,
  LEADERBOARD_SIZE: 50,
  NOTIFICATION_TIMEOUT: 5000, // 5 seconds
  DEBOUNCE_DELAY: 300, // milliseconds
  ANIMATION_DURATION: 200, // milliseconds
  
  // Theme colors
  COLORS: {
    primary: '#0066cc',
    secondary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
} as const;

// Storage keys for localStorage
export const STORAGE_KEYS = {
  WALLET_PREFERENCE: 'questxlm_wallet_preference',
  THEME: 'questxlm_theme',
  USER_SETTINGS: 'questxlm_user_settings',
  QUIZ_PROGRESS: 'questxlm_quiz_progress',
  TUTORIAL_COMPLETED: 'questxlm_tutorial_completed',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  MODULES: '/api/modules',
  USER_PROGRESS: '/api/user/progress',
  LEADERBOARD: '/api/leaderboard',
  ACHIEVEMENTS: '/api/achievements',
  ANALYTICS: '/api/analytics',
  ORACLE: '/api/oracle',
} as const;

// Validation rules
export const VALIDATION = {
  MODULE_TITLE: {
    minLength: 5,
    maxLength: 100,
  },
  MODULE_DESCRIPTION: {
    minLength: 20,
    maxLength: 500,
  },
  REWARD_AMOUNT: {
    min: '1000000', // 0.1 XLM in stroops
    max: '100000000', // 10 XLM in stroops
  },
  COOLDOWN_PERIOD: {
    min: 300, // 5 minutes
    max: 86400, // 24 hours
  },
  REPUTATION_SCORE: {
    min: 0,
    max: 10000,
  },
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_MODULE_CREATION: process.env.NEXT_PUBLIC_ENABLE_MODULE_CREATION === 'true',
  ENABLE_ACHIEVEMENTS: process.env.NEXT_PUBLIC_ENABLE_ACHIEVEMENTS !== 'false',
  ENABLE_LEADERBOARD: process.env.NEXT_PUBLIC_ENABLE_LEADERBOARD !== 'false',
  ENABLE_NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS !== 'false',
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  BETA_FEATURES: process.env.NEXT_PUBLIC_BETA_FEATURES === 'true',
} as const;

// Supported wallets
export const SUPPORTED_WALLETS = {
  FREIGHTER: {
    name: 'Freighter',
    icon: '/wallets/freighter.svg',
    downloadUrl: 'https://freighter.app',
    isInstalled: () => typeof window !== 'undefined' && 'freighter' in window,
  },
  XBULL: {
    name: 'xBull',
    icon: '/wallets/xbull.svg',
    downloadUrl: 'https://xbull.app',
    isInstalled: () => typeof window !== 'undefined' && 'xBullWalletConnect' in window,
  },
  ALBEDO: {
    name: 'Albedo',
    icon: '/wallets/albedo.svg',
    downloadUrl: 'https://albedo.link',
    isInstalled: () => typeof window !== 'undefined' && 'albedo' in window,
  },
} as const;

// Gas and fee estimation
export const FEE_CONFIG = {
  BASE_FEE: '100000', // 0.01 XLM
  CONTRACT_CALL_FEE: '1000000', // 0.1 XLM
  TRANSACTION_FEE: '10000', // 0.001 XLM
} as const;