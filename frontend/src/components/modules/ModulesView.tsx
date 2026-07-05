'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookOpen, Clock, Star, Users } from 'lucide-react';

export function ModulesView() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Learning Modules
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Explore educational content and earn XLM by completing modules
        </p>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Available Modules</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Modules Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We're preparing exciting educational content about Stellar and blockchain technology.
            </p>
            <Button variant="stellar">
              Get Notified When Ready
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}