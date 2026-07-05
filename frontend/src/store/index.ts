/**
 * Global state management with Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  WalletState, 
  UIState, 
  UserProgress, 
  UserReputation, 
  LearningModule,
  Notification,
  ContractState,
} from '@/types';
import { STORAGE_KEYS, DEFAULT_CONFIG, CONTRACT_ADDRESSES } from '@/lib/constants';

// Wallet store
interface WalletStore extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  updateBalance: (balance: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      isConnected: false,
      address: null,
      publicKey: null,
      balance: '0',
      isLoading: false,

      connect: async () => {
        set({ isLoading: true });
        try {
          // Wallet connection logic will be implemented in components
          // This is just the state management structure
          set({ isLoading: false });
        } catch (error) {
          console.error('Wallet connection failed:', error);
          set({ isLoading: false });
        }
      },

      disconnect: () => {
        set({
          isConnected: false,
          address: null,
          publicKey: null,
          balance: '0',
        });
      },

      updateBalance: (balance: string) => {
        set({ balance });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },
    }),
    {
      name: STORAGE_KEYS.WALLET_PREFERENCE,
      partialize: (state) => ({
        address: state.address,
        publicKey: state.publicKey,
        isConnected: state.isConnected,
      }),
    }
  )
);

// UI store
interface UIStore extends UIState {
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setCurrentView: (view: UIState['currentView']) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      sidebarOpen: true,
      currentView: 'dashboard',
      notifications: [],

      setTheme: (theme) => set({ theme }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setCurrentView: (currentView) => set({ currentView }),

      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: Date.now(),
          read: false,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 10), // Keep max 10
        }));

        // Auto-remove after timeout
        if (notification.type !== 'error') {
          setTimeout(() => {
            get().removeNotification(id);
          }, 5000);
        }
      },

      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id),
      })),

      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ),
      })),
    }),
    {
      name: STORAGE_KEYS.USER_SETTINGS,
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

// User data store
interface UserDataStore {
  progress: UserProgress | null;
  reputation: UserReputation | null;
  achievements: number[];
  isLoading: boolean;
  error: string | null;
  
  setProgress: (progress: UserProgress) => void;
  setReputation: (reputation: UserReputation) => void;
  setAchievements: (achievements: number[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useUserDataStore = create<UserDataStore>((set) => ({
  progress: null,
  reputation: null,
  achievements: [],
  isLoading: false,
  error: null,

  setProgress: (progress) => set({ progress }),
  setReputation: (reputation) => set({ reputation }),
  setAchievements: (achievements) => set({ achievements }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  reset: () => set({
    progress: null,
    reputation: null,
    achievements: [],
    isLoading: false,
    error: null,
  }),
}));

// Modules store
interface ModulesStore {
  modules: LearningModule[];
  filteredModules: LearningModule[];
  selectedCategory: string | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  
  setModules: (modules: LearningModule[]) => void;
  addModules: (modules: LearningModule[]) => void;
  setCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
  filterModules: () => void;
  reset: () => void;
}

export const useModulesStore = create<ModulesStore>((set, get) => ({
  modules: [],
  filteredModules: [],
  selectedCategory: null,
  searchQuery: '',
  isLoading: false,
  error: null,
  hasMore: true,

  setModules: (modules) => {
    set({ modules });
    get().filterModules();
  },

  addModules: (newModules) => {
    set((state) => ({ modules: [...state.modules, ...newModules] }));
    get().filterModules();
  },

  setCategory: (selectedCategory) => {
    set({ selectedCategory });
    get().filterModules();
  },

  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().filterModules();
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setHasMore: (hasMore) => set({ hasMore }),

  filterModules: () => {
    const { modules, selectedCategory, searchQuery } = get();
    
    let filtered = modules;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(module => 
        module.module.category === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(module =>
        module.title.toLowerCase().includes(query) ||
        module.description.toLowerCase().includes(query) ||
        module.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    set({ filteredModules: filtered });
  },

  reset: () => set({
    modules: [],
    filteredModules: [],
    selectedCategory: null,
    searchQuery: '',
    isLoading: false,
    error: null,
    hasMore: true,
  }),
}));

// Contract store
interface ContractStore extends ContractState {
  setContract: (contractId: string) => void;
  setNetwork: (network: 'TESTNET' | 'MAINNET') => void;
}

export const useContractStore = create<ContractStore>((set) => ({
  contractId: DEFAULT_CONFIG.NETWORK === 'TESTNET' 
    ? CONTRACT_ADDRESSES.TESTNET.QUEST_PROTOCOL
    : CONTRACT_ADDRESSES.MAINNET.QUEST_PROTOCOL,
  networkPassphrase: DEFAULT_CONFIG.NETWORK === 'TESTNET'
    ? 'Test SDF Network ; September 2015'
    : 'Public Global Stellar Network ; September 2015',
  rpcUrl: DEFAULT_CONFIG.NETWORK === 'TESTNET'
    ? 'https://soroban-testnet.stellar.org'
    : 'https://soroban-mainnet.stellar.org',

  setContract: (contractId) => set({ contractId }),

  setNetwork: (network) => {
    const config = network === 'TESTNET' 
      ? {
          contractId: CONTRACT_ADDRESSES.TESTNET.QUEST_PROTOCOL,
          networkPassphrase: 'Test SDF Network ; September 2015',
          rpcUrl: 'https://soroban-testnet.stellar.org',
        }
      : {
          contractId: CONTRACT_ADDRESSES.MAINNET.QUEST_PROTOCOL,
          networkPassphrase: 'Public Global Stellar Network ; September 2015',
          rpcUrl: 'https://soroban-mainnet.stellar.org',
        };
    
    set(config);
  },
}));

// Leaderboard store
interface LeaderboardStore {
  entries: any[];
  userRank: number | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  
  setEntries: (entries: any[]) => void;
  setUserRank: (rank: number | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastUpdated: (timestamp: number) => void;
  reset: () => void;
}

export const useLeaderboardStore = create<LeaderboardStore>((set) => ({
  entries: [],
  userRank: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  setEntries: (entries) => set({ entries }),
  setUserRank: (userRank) => set({ userRank }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastUpdated: (lastUpdated) => set({ lastUpdated }),

  reset: () => set({
    entries: [],
    userRank: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
  }),
}));

// Quiz store for tracking quiz progress
interface QuizStore {
  currentQuiz: any | null;
  answers: number[];
  timeRemaining: number;
  isActive: boolean;
  score: number | null;
  
  startQuiz: (quiz: any) => void;
  setAnswer: (questionIndex: number, answerIndex: number) => void;
  setTimeRemaining: (time: number) => void;
  submitQuiz: () => void;
  reset: () => void;
}

export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      currentQuiz: null,
      answers: [],
      timeRemaining: 0,
      isActive: false,
      score: null,

      startQuiz: (quiz) => set({
        currentQuiz: quiz,
        answers: new Array(quiz.questions.length).fill(-1),
        timeRemaining: quiz.timeLimit,
        isActive: true,
        score: null,
      }),

      setAnswer: (questionIndex, answerIndex) => {
        const { answers } = get();
        const newAnswers = [...answers];
        newAnswers[questionIndex] = answerIndex;
        set({ answers: newAnswers });
      },

      setTimeRemaining: (timeRemaining) => set({ timeRemaining }),

      submitQuiz: () => {
        const { currentQuiz, answers } = get();
        if (!currentQuiz) return;

        // Calculate score
        let correct = 0;
        currentQuiz.questions.forEach((question: any, index: number) => {
          if (answers[index] === question.correctAnswer) {
            correct++;
          }
        });

        const score = (correct / currentQuiz.questions.length) * 100;
        set({ score, isActive: false });
      },

      reset: () => set({
        currentQuiz: null,
        answers: [],
        timeRemaining: 0,
        isActive: false,
        score: null,
      }),
    }),
    {
      name: STORAGE_KEYS.QUIZ_PROGRESS,
      partialize: (state) => ({
        currentQuiz: state.currentQuiz,
        answers: state.answers,
        timeRemaining: state.timeRemaining,
        isActive: state.isActive,
      }),
    }
  )
);

// Analytics store
interface AnalyticsStore {
  userStats: any | null;
  globalStats: any | null;
  isLoading: boolean;
  error: string | null;
  
  setUserStats: (stats: any) => void;
  setGlobalStats: (stats: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  userStats: null,
  globalStats: null,
  isLoading: false,
  error: null,

  setUserStats: (userStats) => set({ userStats }),
  setGlobalStats: (globalStats) => set({ globalStats }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  reset: () => set({
    userStats: null,
    globalStats: null,
    isLoading: false,
    error: null,
  }),
}));