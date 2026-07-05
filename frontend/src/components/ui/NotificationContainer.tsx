'use client';

import React from 'react';
import { useUIStore } from '@/store';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const NotificationIcon = ({ type }: { type: 'success' | 'error' | 'warning' | 'info' }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-500" />;
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

export function NotificationContainer() {
  const { notifications, removeNotification, markNotificationRead } = useUIStore();

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "rounded-lg border p-4 shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out",
            getNotificationStyles(notification.type),
            notification.read ? 'opacity-75' : 'opacity-100'
          )}
        >
          <div className="flex items-start space-x-3">
            <NotificationIcon type={notification.type} />
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {notification.message}
              </p>
              
              {notification.action && (
                <button
                  onClick={() => {
                    notification.action?.onClick();
                    markNotificationRead(notification.id);
                  }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-2"
                >
                  {notification.action.label}
                </button>
              )}
            </div>
            
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}