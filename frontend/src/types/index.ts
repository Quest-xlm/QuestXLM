/**
 * TypeScript type definitions for QuestXLM Protocol
 * Matches the Soroban smart contract data structures
 */

export interface ProtocolConfig {
  min_cooldown: number;
  max_cooldown: number;
  initial_reputation: number;
  min_reward: string; // BigInt as string for JSON compatibility
  max_reward: string;
  creator_share: number;
  oracle_fee: number;
  cheat_threshold: number;
}

export interface Module {
  creator: string;
  content_hash: string;
  quiz_hash: string;
  reward_amount: string; // BigInt as string
  cooldown_period: number;
  difficulty_level: number;
  min_reputation: number;
  category: string;
  is_active: boolean;
  created_at: number;
  completion_count: number;
  success_rate: number;
}

export interface UserProgress {
  completions: Map<number, number>;
  total_earned: string; // BigInt as string
  current_streak: number;
  best_streak: number;
  last_activity: number;
  active_modules: number[];
}

export interface UserReputation {
  score: number;
  accuracy_rate: number;
  speed_bonus: number;
  consistency_bonus: number;
  penalty_points: number;
  verification_level: number;
}

export interface LeaderboardEntry {
  user: string;
  score: string; // BigInt as string
  rank: number;
  badge_level: number;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlocked_at?: number;
}

// Frontend-specific types
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  publicKey: string | null;
  balance: string;
  isLoading: boolean;
}

export interface ContractState {
  contractId: string;
  networkPassphrase: string;
  rpcUrl: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: number;
  category: string;
}

export interface Quiz {
  id: string;
  moduleId: number;
  title: string;
  description: string;
  questions: QuizQuestion[];
  timeLimit: number; // seconds
  passingScore: number; // percentage
}

export interface QuizAttempt {
  quizId: string;
  moduleId: number;
  answers: number[];
  score: number;
  timeSpent: number;
  completed: boolean;
  submittedAt: number;
}

export interface LearningModule {
  id: number;
  title: string;
  description: string;
  content: string;
  contentType: 'markdown' | 'video' | 'interactive';
  estimatedTime: number; // minutes
  prerequisites: number[];
  tags: string[];
  quiz?: Quiz;
  module: Module; // On-chain module data
}

// UI State types
export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  currentView: 'dashboard' | 'modules' | 'leaderboard' | 'achievements' | 'profile';
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ModuleListResponse {
  modules: LearningModule[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userRank?: number;
  totalUsers: number;
}

// Error types
export class QuestXLMError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'QuestXLMError';
    this.code = code;
    this.details = details;
  }
}

// Contract interaction types
export interface ContractCallOptions {
  fee?: string;
  memo?: string;
  timeoutInSeconds?: number;
}

export interface ContractTransaction {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  result?: any;
  error?: string;
}

// Utility types
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export type ModuleCategory = 
  | 'stellar-basics'
  | 'soroban-development'
  | 'defi-concepts'
  | 'smart-contracts'
  | 'blockchain-fundamentals'
  | 'web3-integration'
  | 'security-best-practices';

export type BadgeLevel = 0 | 1 | 2 | 3 | 4 | 5;

// Hook return types
export interface UseModulesReturn {
  modules: LearningModule[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  loadMore: () => void;
  hasMore: boolean;
}

export interface UseUserDataReturn {
  progress: UserProgress | null;
  reputation: UserReputation | null;
  achievements: Achievement[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseContractReturn {
  contract: any; // Stellar SDK contract instance
  isReady: boolean;
  error: Error | null;
  call: (method: string, ...args: any[]) => Promise<any>;
  simulate: (method: string, ...args: any[]) => Promise<any>;
}

// Form types
export interface CreateModuleForm {
  title: string;
  description: string;
  content: string;
  category: ModuleCategory;
  difficulty: DifficultyLevel;
  reward: string;
  cooldown: number;
  minReputation: number;
  tags: string[];
  quiz: Quiz;
}

export interface UserProfileForm {
  displayName: string;
  bio: string;
  avatar?: File;
  preferences: {
    notifications: boolean;
    publicProfile: boolean;
    showStats: boolean;
  };
}

// Analytics types
export interface LearningStats {
  modulesCompleted: number;
  totalTimeSpent: number; // minutes
  streakDays: number;
  averageScore: number;
  favoriteCategory: ModuleCategory;
  weeklyProgress: number[];
  monthlyEarnings: string[];
}

export interface GlobalStats {
  totalUsers: number;
  totalModules: number;
  totalRewardsDistributed: string;
  averageCompletionTime: number;
  topCategories: { category: ModuleCategory; count: number }[];
}

// WebSocket event types
export interface WebSocketEvent {
  type: 'completion' | 'achievement' | 'leaderboard_update' | 'module_created';
  data: any;
  timestamp: number;
}

export interface ModuleCompletionEvent extends WebSocketEvent {
  type: 'completion';
  data: {
    user: string;
    moduleId: number;
    reward: string;
    newRank?: number;
  };
}

export interface AchievementUnlockedEvent extends WebSocketEvent {
  type: 'achievement';
  data: {
    user: string;
    achievementId: number;
    title: string;
  };
}