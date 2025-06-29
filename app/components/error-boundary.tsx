'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // エラー情報をログに記録
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 外部エラー追跡サービスに送信（将来的にSentryなど）
    this.reportError(error, errorInfo);

    // プロップスで渡されたエラーハンドラーを呼び出し
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // エラー報告の実装
    const errorData = {
      id: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // 開発環境では詳細をコンソールに出力
    if (process.env.NODE_ENV === 'development') {
      console.group('🐛 Error Report');
      console.error('Error ID:', errorData.id);
      console.error('Message:', errorData.message);
      console.error('Stack:', errorData.stack);
      console.error('Component Stack:', errorData.componentStack);
      console.groupEnd();
    }

    // 本番環境では外部サービスに送信
    // TODO: Sentry, LogRocket, Bugsnag などの統合
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックが提供されている場合はそれを使用
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // デフォルトのエラーUI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="max-w-lg w-full border-red-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-red-800">
                予期しないエラーが発生しました
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-center text-gray-600">
                <p className="mb-2">
                  申し訳ございません。アプリケーションでエラーが発生しました。
                </p>
                <p className="text-sm">
                  この問題は開発チームに自動的に報告されます。
                </p>
              </div>

              {this.state.errorId && (
                <div className="bg-gray-100 p-3 rounded border text-sm">
                  <p className="font-medium text-gray-700 mb-1">エラーID:</p>
                  <code className="text-gray-600 break-all">
                    {this.state.errorId}
                  </code>
                </div>
              )}

              {/* 開発環境でのみエラー詳細を表示 */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-red-50 border border-red-200 rounded p-3">
                  <summary className="cursor-pointer font-medium text-red-800 mb-2">
                    <Bug className="w-4 h-4 inline mr-2" />
                    開発者向け詳細情報
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="font-medium text-red-700">エラーメッセージ:</p>
                      <code className="text-sm text-red-600 block bg-red-100 p-2 rounded mt-1">
                        {this.state.error.message}
                      </code>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <p className="font-medium text-red-700">スタックトレース:</p>
                        <pre className="text-xs text-red-600 bg-red-100 p-2 rounded mt-1 overflow-auto max-h-32">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center justify-center"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  再試行
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  ページを再読み込み
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center"
                  variant="ghost"
                >
                  <Home className="w-4 h-4 mr-2" />
                  ホームに戻る
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for easier wrapping
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}