'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useWallet, useUserData, useTreasuryBalance } from '@/hooks/useContract';
import { StellarUtils } from '@/lib/stellar';
import { formatNumber, formatRelativeTime } from '@/lib/utils';
import { useUIStore } from '@/store';
import { 
  TrendingUp, 
  Award, 
  BookOpen, 
  Zap, 
  Users, 
  DollarSign,
  Target,
  Calendar,
  Trophy,
  Star,
  Activity,
  ArrowRight
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

function StatCard({ title, value, description, icon, trend, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClasses[color]} text-white`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </div>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp 
              className={`h-4 w-4 mr-1 ${
                trend.isPositive ? 'text-green-500' : 'text-red-500 rotate-180'
              }`} 
            />
            <span className={`text-sm font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-gray-500 ml-1">vs last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RecentActivityItem {
  id: string;
  type: 'completion' | 'achievement' | 'streak';
  title: string;
  description: string;
  timestamp: number;
  reward?: string;
}

function RecentActivity() {
  // Mock data - in real app, this would come from the contract or API
  const activities: RecentActivityItem[] = [
    {
      id: '1',
      type: 'completion',
      title: 'Completed "Stellar Basics"',
      description: 'Earned 0.5 XLM for perfect score',
      timestamp: Date.now() - 3600000,
      reward: '0.5',
    },
    {
      id: '2',
      type: 'achievement',
      title: 'Achievement Unlocked: First Steps',
      description: 'Complete your first module',
      timestamp: Date.now() - 7200000,
    },
    {
      id: '3',
      type: 'streak',
      title: '7-Day Learning Streak!',
      description: 'Keep it up for bonus rewards',
      timestamp: Date.now() - 86400000,
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completion':
        return <BookOpen className="h-4 w-4 text-green-500" />;
      case 'achievement':
        return <Award className="h-4 w-4 text-yellow-500" />;
      case 'streak':
        return <Zap className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {formatRelativeTime(Math.floor(activity.timestamp / 1000))}
                </p>
              </div>
              {activity.reward && (
                <div className="text-sm font-medium text-green-600">
                  +{activity.reward} XLM
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const { setCurrentView } = useUIStore();

  const actions = [
    {
      title: 'Start Learning',
      description: 'Browse available modules',
      icon: <BookOpen className="h-5 w-5" />,
      action: () => setCurrentView('modules'),
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'View Progress',
      description: 'Check your achievements',
      icon: <Award className="h-5 w-5" />,
      action: () => setCurrentView('achievements'),
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Leaderboard',
      description: 'See your ranking',
      icon: <Trophy className="h-5 w-5" />,
      action: () => setCurrentView('leaderboard'),
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-between h-auto p-4"
              onClick={action.action}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg text-white ${action.color}`}>
                  {action.icon}
                </div>
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-gray-500">{action.description}</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { isConnected, balance } = useWallet();
  const { progress, reputation, isLoading } = useUserData();
  const { data: treasuryBalance } = useTreasuryBalance();

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to QuestXLM
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect your wallet to start earning XLM by learning about Stellar and blockchain technology.
          </p>
          <Button variant="stellar" size="lg">
            Connect Wallet to Get Started
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your learning progress and earnings
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button variant="stellar">
            Start New Module
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Earned"
          value={StellarUtils.formatXLM(progress?.total_earned || '0')}
          description="Lifetime XLM earnings"
          icon={<DollarSign className="h-4 w-4" />}
          trend={{ value: 12.5, isPositive: true }}
          color="green"
        />
        
        <StatCard
          title="Modules Completed"
          value={progress?.completions ? Object.keys(progress.completions).length : 0}
          description="Learning modules finished"
          icon={<BookOpen className="h-4 w-4" />}
          trend={{ value: 8.2, isPositive: true }}
          color="blue"
        />
        
        <StatCard
          title="Current Streak"
          value={`${progress?.current_streak || 0} days`}
          description="Consecutive learning days"
          icon={<Zap className="h-4 w-4" />}
          trend={{ value: 15.3, isPositive: true }}
          color="orange"
        />
        
        <StatCard
          title="Reputation Score"
          value={formatNumber(reputation?.score || 0)}
          description="Your learning reputation"
          icon={<Star className="h-4 w-4" />}
          trend={{ value: 5.7, isPositive: true }}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity - Takes 2/3 of the width */}
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        
        {/* Quick Actions - Takes 1/3 of the width */}
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Community Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Learners</span>
                <span className="font-medium">12,453</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Modules</span>
                <span className="font-medium">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">XLM Distributed</span>
                <span className="font-medium">{StellarUtils.formatXLM(treasuryBalance || '0')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Weekly Goals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Modules (3/5)</span>
                  <span className="text-sm font-medium">60%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Streak (7/7)</span>
                  <span className="text-sm font-medium">100%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>This Week</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Time Spent</span>
                <span className="font-medium">4.2 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Score</span>
                <span className="font-medium">92%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">XLM Earned</span>
                <span className="font-medium text-green-600">2.5 XLM</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}