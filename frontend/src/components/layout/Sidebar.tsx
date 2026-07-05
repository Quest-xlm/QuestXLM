'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';
import { 
  Home, 
  BookOpen, 
  Trophy, 
  Award, 
  User, 
  BarChart3,
  Wallet,
  Settings,
  HelpCircle,
  ChevronLeft,
  Zap
} from 'lucide-react';

const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    description: 'Overview and quick stats',
  },
  {
    id: 'modules',
    label: 'Learning Modules',
    icon: BookOpen,
    description: 'Browse and complete modules',
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    icon: Trophy,
    description: 'See top performers',
  },
  {
    id: 'achievements',
    label: 'Achievements',
    icon: Award,
    description: 'View your badges and achievements',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    description: 'Manage your account',
  },
] as const;

const secondaryItems = [
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'View detailed statistics',
  },
  {
    id: 'wallet',
    label: 'Wallet',
    icon: Wallet,
    description: 'Manage your XLM',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    description: 'App preferences',
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: HelpCircle,
    description: 'Get assistance',
  },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, currentView, setCurrentView } = useUIStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 transform bg-white border-r transition-transform duration-300 ease-in-out dark:bg-gray-900 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:w-16"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            {sidebarOpen && (
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Zap className="h-3 w-3 text-white" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  Navigation
                </span>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hidden lg:flex"
            >
              <ChevronLeft
                className={cn(
                  "h-4 w-4 transition-transform",
                  !sidebarOpen && "rotate-180"
                )}
              />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-2">
            {/* Primary navigation */}
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      !sidebarOpen && "justify-center px-2"
                    )}
                    onClick={() => setCurrentView(item.id as any)}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <Icon className={cn("h-4 w-4", sidebarOpen && "mr-2")} />
                    {sidebarOpen && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="my-4 border-t" />

            {/* Secondary navigation */}
            <div className="space-y-1">
              {secondaryItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
                      !sidebarOpen && "justify-center px-2"
                    )}
                    onClick={() => {
                      // Handle secondary navigation
                      console.log(`Navigate to ${item.id}`);
                    }}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <Icon className={cn("h-4 w-4", sidebarOpen && "mr-2")} />
                    {sidebarOpen && (
                      <span className="truncate text-sm">{item.label}</span>
                    )}
                  </Button>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          {sidebarOpen && (
            <div className="p-4 border-t">
              <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-3 dark:from-blue-900/20 dark:to-purple-900/20">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="h-6 w-6 rounded bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Award className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Pro Tip
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Complete daily modules to maintain your learning streak and earn bonus rewards!
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}