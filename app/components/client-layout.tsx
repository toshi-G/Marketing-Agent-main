'use client'

import React from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { NotificationProvider } from '@/components/notification-system';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // エラー情報をロギングサービスに送信
    console.error('Application Error:', error, errorInfo);
  };

  return (
    <ErrorBoundary onError={handleError}>
      <NotificationProvider maxNotifications={3}>
        {children}
      </NotificationProvider>
    </ErrorBoundary>
  );
}