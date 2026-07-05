'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useWallet } from '@/hooks/useContract';
import { useUIStore } from '@/store';
import { StellarUtils } from '@/lib/stellar';
import { 
  Wallet, 
  Menu, 
  Sun, 
  Moon, 
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Zap
} from 'lucide-react';
import { cn, truncateText } from '@/lib/utils';
import { useTheme } from 'next-themes';

export function Header() {
  const { isConnected, address, balance, connect, disconnect, isLoading } = useWallet();
  const { toggleSidebar, notifications } = useUIStore();
  const { theme, setTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                QuestXLM
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Learn to Earn on Stellar
              </p>
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-3">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeToggle}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
          >
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </Button>

          {/* Wallet section */}
          {isConnected ? (
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2"
              >
                <Wallet className="h-4 w-4" />
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-xs text-gray-500">
                    {truncateText(address || '', 12)}
                  </span>
                  <span className="text-xs font-medium">
                    {StellarUtils.formatXLM(balance)}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>

              {/* User menu dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-md border bg-white shadow-lg dark:bg-gray-800">
                  <div className="p-3 border-b">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Connected Wallet
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {address}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      Balance: {StellarUtils.formatXLM(balance)}
                    </p>
                  </div>
                  
                  <div className="py-1">
                    <button
                      onClick={() => {
                        useUIStore.setState({ currentView: 'profile' });
                        setShowUserMenu(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </button>
                    
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </button>
                    
                    <hr className="my-1" />
                    
                    <button
                      onClick={() => {
                        disconnect();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={connect}
              loading={isLoading}
              variant="stellar"
              leftIcon={<Wallet className="h-4 w-4" />}
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}