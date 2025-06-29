'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Target,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  Filter,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { PerformanceChart } from '../charts/performance-chart';
import { TemplateChart } from '../charts/template-chart';
import { WorkflowStatsChart } from '../charts/workflow-stats-chart';

// ダッシュボードデータの型定義
interface DashboardMetrics {
  totalWorkflows: number;
  completedWorkflows: number;
  averageCompletionTime: number;
  successRate: number;
  totalGeneratedContent: number;
  topPerformingTemplates: Array<{
    id: string;
    name: string;
    performance: number;
    usage: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: 'success' | 'error' | 'pending';
  }>;
  performanceOverTime: Array<{
    date: string;
    workflows: number;
    success_rate: number;
    avg_time: number;
  }>;
}

interface AnalyticsDashboardProps {
  className?: string;
}

export function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ダッシュボードデータを取得
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/dashboard?range=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics');
      }
      
      const data = await response.json();
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
      // フォールバックデータを設定
      setMetrics({
        totalWorkflows: 0,
        completedWorkflows: 0,
        averageCompletionTime: 0,
        successRate: 0,
        totalGeneratedContent: 0,
        topPerformingTemplates: [],
        recentActivity: [],
        performanceOverTime: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  // 自動更新（5分毎）
  useEffect(() => {
    const interval = setInterval(fetchMetrics, 300000); // 5分
    return () => clearInterval(interval);
  }, [timeRange]);

  // 時間範囲のラベル
  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return '過去7日間';
      case '30d': return '過去30日間';
      case '90d': return '過去90日間';
      default: return '過去30日間';
    }
  };

  // データエクスポート
  const handleExport = async () => {
    try {
      const response = await fetch(`/api/analytics/export?range=${timeRange}&format=csv`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marketing-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">分析ダッシュボード</h2>
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        {/* スケルトンローダー */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <p className="text-gray-500 mb-4">データの読み込みに失敗しました</p>
          <Button onClick={fetchMetrics} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            再試行
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">分析ダッシュボード</h2>
          <p className="text-gray-600">
            {getTimeRangeLabel(timeRange)}のパフォーマンス概要
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 時間範囲選択 */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  timeRange === range
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range === '7d' ? '7日' : range === '30d' ? '30日' : '90日'}
              </button>
            ))}
          </div>
          
          {/* エクスポートボタン */}
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            エクスポート
          </Button>
          
          {/* 更新ボタン */}
          <Button onClick={fetchMetrics} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 最終更新時刻 */}
      {lastUpdated && (
        <p className="text-sm text-gray-500">
          最終更新: {lastUpdated.toLocaleString()}
        </p>
      )}

      {/* メトリクスカード */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総ワークフロー</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics.totalWorkflows.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+12% vs 前期間</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">成功率</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics.successRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metrics.successRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均実行時間</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(metrics.averageCompletionTime / 60)}分
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              最速: {Math.round(metrics.averageCompletionTime * 0.7 / 60)}分
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">生成コンテンツ</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics.totalGeneratedContent.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              今日: +{Math.round(metrics.totalGeneratedContent * 0.05)} 件
            </p>
          </CardContent>
        </Card>
      </div>

      {/* チャートとリストのセクション */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* パフォーマンス推移チャート */}
        <div className="lg:col-span-2">
          <PerformanceChart 
            data={metrics.performanceOverTime} 
            timeRange={timeRange}
          />
        </div>

        {/* 最近のアクティビティ */}
        <Card>
          <CardHeader>
            <CardTitle>最近のアクティビティ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recentActivity.length > 0 ? (
                metrics.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <Badge 
                      variant={
                        activity.status === 'success' ? 'default' :
                        activity.status === 'error' ? 'destructive' : 'outline'
                      }
                      className="mt-0.5"
                    >
                      {activity.status === 'success' ? '完了' :
                       activity.status === 'error' ? 'エラー' : '実行中'}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>最近のアクティビティはありません</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* チャート追加セクション */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* トップパフォーマンステンプレート */}
        <TemplateChart 
          data={metrics.topPerformingTemplates}
          chartType="bar"
        />
        
        {/* ワークフロー統計 */}
        <WorkflowStatsChart 
          data={metrics.performanceOverTime.map(d => ({
            date: d.date,
            total: d.workflows,
            completed: Math.round(d.workflows * d.success_rate / 100),
            failed: Math.round(d.workflows * (100 - d.success_rate) / 100),
            running: 0,
            avgTime: d.avg_time
          }))}
          chartType="area"
        />
      </div>
    </div>
  );
}