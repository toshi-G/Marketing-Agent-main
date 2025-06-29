import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './styles/globals.css'
import { ErrorBoundary } from '@/components/error-boundary'
import { NotificationProvider } from '@/components/notification-system'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Marketing Agent - AI駆動マーケティング自動化',
  description: '8つの専門AIエージェントが連携し、市場調査からコンテンツ生成まで自動化',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <ErrorBoundary
          onError={(error, errorInfo) => {
            // エラー情報をロギングサービスに送信
            console.error('Application Error:', error, errorInfo);
          }}
        >
          <NotificationProvider maxNotifications={3}>
            {children}
          </NotificationProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
