'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Award, Star, Trophy } from 'lucide-react';

export function AchievementsView() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Achievements
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track your progress and unlock badges as you learn
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Your Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Start Learning to Earn Achievements
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Complete modules and maintain learning streaks to unlock badges and special rewards.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}