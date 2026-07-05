/**
 * Custom React hooks for contract interactions
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  QuestXLMContract, 
  WalletManager, 
  questContract 
} from '@/lib/stellar';
import { 
  useWalletStore, 
  useUserDataStore, 
  useModulesStore,
  useLeaderboardStore,
  useUIStore 
} from '@/store';
import { 
  LearningModule, 
  UserProgress, 
  UserReputation,
  QuestXLMError 
} from '@/types';

/**
 * Hook for wallet connection and management
 */
export function useWallet() {
  const {
    isConnected,
    address,
    publicKey,
    balance,
    isLoading,
    connect: storeConnect,
    disconnect,
    updateBalance,
    setLoading,
  } = useWalletStore();

  const { addNotification } = useUIStore();

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const wallet = await WalletManager.connectFreighter();
      const balance = await WalletManager.getAccountBalance(wallet.publicKey);
      
      useWalletStore.setState({
        isConnected: true,
        address: wallet.address,
        publicKey: wallet.publicKey,
        balance,
        isLoading: false,
      });

      addNotification({
        type: 'success',
        title: 'Wallet Connected',
        message: 'Successfully connected to Freighter wallet',
      });
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setLoading(false);
      
      addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: error instanceof QuestXLMError ? error.message : 'Failed to connect wallet',
      });
    }
  }, [setLoading, addNotification]);

  const refreshBalance = useCallback(async () => {
    if (!publicKey) return;
    
    try {
      const newBalance = await WalletManager.getAccountBalance(publicKey);
      updateBalance(newBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [publicKey, updateBalance]);

  return {
    isConnected,
    address,
    publicKey,
    balance,
    isLoading,
    connect,
    disconnect,
    refreshBalance,
  };
}

/**
 * Hook for fetching user progress and reputation
 */
export function useUserData(userAddress?: string) {
  const { publicKey } = useWalletStore();
  const { 
    progress, 
    reputation, 
    achievements, 
    isLoading, 
    error,
    setProgress,
    setReputation,
    setAchievements,
    setLoading,
    setError,
  } = useUserDataStore();

  const targetAddress = userAddress || publicKey;

  const fetchUserData = useCallback(async () => {
    if (!targetAddress) return;

    setLoading(true);
    setError(null);

    try {
      const [userProgress, userReputation, userAchievements] = await Promise.all([
        questContract.getUserProgress(targetAddress),
        questContract.getUserReputation(targetAddress),
        questContract.getUserAchievements(targetAddress),
      ]);

      setProgress(userProgress);
      setReputation(userReputation);
      setAchievements(userAchievements);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [targetAddress, setProgress, setReputation, setAchievements, setLoading, setError]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return {
    progress,
    reputation,
    achievements,
    isLoading,
    error,
    refetch: fetchUserData,
  };
}

/**
 * Hook for fetching and managing modules
 */
export function useModules() {
  const {
    modules,
    filteredModules,
    selectedCategory,
    searchQuery,
    isLoading,
    error,
    hasMore,
    setModules,
    addModules,
    setCategory,
    setSearchQuery,
    setLoading,
    setError,
    setHasMore,
  } = useModulesStore();

  const fetchModules = useCallback(async (startId: number = 0, limit: number = 12) => {
    setLoading(true);
    setError(null);

    try {
      const moduleData = await questContract.getModulesBatch(startId, limit);
      
      // Transform on-chain data to LearningModule format
      const learningModules: LearningModule[] = moduleData.map((module, index) => ({
        id: startId + index,
        title: `Module ${startId + index + 1}`, // Would come from content hash lookup
        description: 'Learn about blockchain fundamentals', // Would come from content hash lookup
        content: '', // Would be fetched separately
        contentType: 'markdown' as const,
        estimatedTime: 30,
        prerequisites: [],
        tags: [module.category],
        module: module,
      }));

      if (startId === 0) {
        setModules(learningModules);
      } else {
        addModules(learningModules);
      }

      setHasMore(learningModules.length === limit);
    } catch (error) {
      console.error('Failed to fetch modules:', error);
      setError(error instanceof Error ? error.message : 'Failed to load modules');
    } finally {
      setLoading(false);
    }
  }, [setModules, addModules, setLoading, setError, setHasMore]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchModules(modules.length, 12);
    }
  }, [fetchModules, modules.length, isLoading, hasMore]);

  useEffect(() => {
    if (modules.length === 0) {
      fetchModules();
    }
  }, []);

  return {
    modules: filteredModules,
    allModules: modules,
    selectedCategory,
    searchQuery,
    isLoading,
    error,
    hasMore,
    setCategory,
    setSearchQuery,
    refetch: () => fetchModules(0, 12),
    loadMore,
  };
}

/**
 * Hook for leaderboard data
 */
export function useLeaderboard(limit: number = 50) {
  const {
    entries,
    userRank,
    isLoading,
    error,
    lastUpdated,
    setEntries,
    setUserRank,
    setLoading,
    setError,
    setLastUpdated,
  } = useLeaderboardStore();

  const { publicKey } = useWalletStore();

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const leaderboardData = await questContract.getLeaderboard(limit);
      setEntries(leaderboardData);

      // Find user rank if connected
      if (publicKey) {
        const userIndex = leaderboardData.findIndex(
          (entry: any) => entry.user === publicKey
        );
        setUserRank(userIndex >= 0 ? userIndex + 1 : null);
      }

      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setError(error instanceof Error ? error.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [limit, publicKey, setEntries, setUserRank, setLoading, setError, setLastUpdated]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    entries,
    userRank,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchLeaderboard,
  };
}

/**
 * Hook for contract write operations
 */
export function useContractMutations() {
  const { publicKey } = useWalletStore();
  const { addNotification } = useUIStore();
  const queryClient = useQueryClient();

  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      if (!publicKey) {
        throw new QuestXLMError('Wallet not connected', 'WALLET_NOT_CONNECTED');
      }
      
      return questContract.createModule(publicKey, moduleData);
    },
    onSuccess: (data) => {
      addNotification({
        type: 'success',
        title: 'Module Created',
        message: 'Your educational module has been successfully created!',
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: error instanceof Error ? error.message : 'Failed to create module',
      });
    },
  });

  const submitCompletionMutation = useMutation({
    mutationFn: async ({ 
      moduleId, 
      answerHash, 
      completionTime 
    }: { 
      moduleId: number; 
      answerHash: string; 
      completionTime: number; 
    }) => {
      if (!publicKey) {
        throw new QuestXLMError('Wallet not connected', 'WALLET_NOT_CONNECTED');
      }
      
      return questContract.submitCompletion(
        publicKey, 
        moduleId, 
        answerHash, 
        completionTime
      );
    },
    onSuccess: (data) => {
      addNotification({
        type: 'success',
        title: 'Module Completed!',
        message: 'Congratulations! You\'ve earned XLM for completing this module.',
      });
      
      // Invalidate user data and leaderboard
      queryClient.invalidateQueries({ queryKey: ['userData'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error instanceof Error ? error.message : 'Failed to submit completion',
      });
    },
  });

  return {
    createModule: createModuleMutation,
    submitCompletion: submitCompletionMutation,
  };
}

/**
 * Hook for real-time contract data with polling
 */
export function useContractData<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  } = {}
) {
  return useQuery({
    queryKey,
    queryFn,
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval ?? 30000, // 30 seconds
    staleTime: options.staleTime ?? 10000, // 10 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook for treasury balance monitoring
 */
export function useTreasuryBalance() {
  return useContractData(
    ['treasury-balance'],
    () => questContract.getTreasuryBalance(),
    {
      refetchInterval: 60000, // 1 minute
      staleTime: 30000, // 30 seconds
    }
  );
}

/**
 * Hook for protocol configuration
 */
export function useProtocolConfig() {
  return useContractData(
    ['protocol-config'],
    () => questContract.getConfig(),
    {
      refetchInterval: 300000, // 5 minutes
      staleTime: 60000, // 1 minute
    }
  );
}

/**
 * Hook for module statistics
 */
export function useModuleStats(moduleId: number) {
  return useContractData(
    ['module-stats', moduleId],
    () => questContract.getModule(moduleId),
    {
      enabled: moduleId >= 0,
      refetchInterval: 120000, // 2 minutes
    }
  );
}