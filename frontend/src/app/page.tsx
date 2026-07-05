'use client';

import React, { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ModulesView } from '@/components/modules/ModulesView';
import { LeaderboardView } from '@/components/leaderboard/LeaderboardView';
import { AchievementsView } from '@/components/achievements/AchievementsView';
import { ProfileView } from '@/components/profile/ProfileView';
import { NotificationContainer } from '@/components/ui/NotificationContainer';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { currentView, sidebarOpen } = useUIStore();

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'modules':
        return <ModulesView />;
      case 'leaderboard':
        return <LeaderboardView />;
      case 'achievements':
        return <AchievementsView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main 
          className={cn(
            'flex-1 transition-all duration-300 ease-in-out',
            sidebarOpen ? 'ml-64' : 'ml-16'
          )}
        >
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
      
      <NotificationContainer />
    </div>
  );
}