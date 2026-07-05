'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trophy, Medal, Award } from 'lucide-react';

export function LeaderboardView() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Leaderboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          See how you rank against other learners in the QuestXLM community
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Top Performers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Leaderboard Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Connect your wallet and complete modules to see your ranking!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}