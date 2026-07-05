'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { User, Settings, Wallet } from 'lucide-react';

export function ProfileView() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account settings and view your learning statistics
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Profile Management Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Customize your profile, manage preferences, and track your detailed learning statistics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}