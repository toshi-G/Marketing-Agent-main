'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3, 
  PieChart,
  Activity,
  Clock,
  Users,
  Zap,
  Award,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Calendar,
  Filter
} from 'lucide-react';
import { PerformanceChart } from '@/components/charts/performance-chart';
import { TemplateChart } from '@/components/charts/template-chart';
import { WorkflowStatsChart } from '@/components/charts/workflow-stats-chart';

// パフォーマンス指標の型定義
interface PerformanceMetrics {
  overview: {
    totalWorkflows: number;
    successRate: number;
    averageExecutionTime: number;
    totalContentGenerated: number;
    conversionRate: number;
    engagementRate: number;
  };
  trends: {
    workflowTrend: number;
    successTrend: number;
    timeTrend: number;
    engagementTrend: number;
  };
  goals: {
    successRateGoal: number;
    executionTimeGoal: number;
    contentVolumeGoal: number;
    engagementGoal: number;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'success' | 'info' | 'error';
    title: string;
    message: string;
    timestamp: string;
  }>;
  topPerformers: Array<{
    id: string;
    name: string;
    type: 'workflow' | 'template' | 'agent';
    performance: number;
    improvement: number;
  }>;
  insights: Array<{
    id: string;
    category: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
  }>;
}

interface TimeSeriesData {
  date: string;
  workflows: number;
  success_rate: number;
  avg_time: number;
  engagement: number;
  conversion: number;
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'success' | 'time' | 'engagement' | 'conversion'>('success');

  // パフォーマンスデータを取得
  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/performance?range=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }
      
      const data = await response.json();
      setMetrics(data.metrics);
      setTimeSeriesData(data.timeSeries);
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
      // フォールバックデータ
      setMetrics(null);
      setTimeSeriesData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange]);

  // トレンド表示
  const renderTrend = (value: number, isInverted = false) => {
    const isPositive = isInverted ? value < 0 : value > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className={`flex items-center ${colorClass}`}>
        <Icon className="w-4 h-4 mr-1" />
        <span className="text-sm font-medium">
          {Math.abs(value).toFixed(1)}%
        </span>
      </div>
    );
  };

  // ゴール達成率の計算
  const calculateGoalProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  // アラートアイコンの取得
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      default: return Activity;
    }
  };

  // アラート色の取得
  const getAlertColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  // データエクスポート
  const handleExport = async () => {
    try {
      const response = await fetch(`/api/analytics/performance/export?range=${timeRange}&format=csv`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-metrics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
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
      <div className="container-responsive py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="container-responsive py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">パフォーマンス指標</h1>
          <p className="text-gray-600 mb-4">データの読み込みに失敗しました</p>
          <Button onClick={fetchPerformanceData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            再試行
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive py-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-responsive-xl font-bold text-gray-900">パフォーマンス指標</h1>
          <p className="text-gray-600">
            AIマーケティングエージェントのパフォーマンス分析と最適化
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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
          
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            エクスポート
          </Button>
          
          <Button onClick={fetchPerformanceData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 概要メトリクス */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">成功率</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics.overview.successRate.toFixed(1)}%
                </p>
                {renderTrend(metrics.trends.successTrend)}
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${calculateGoalProgress(metrics.overview.successRate, metrics.goals.successRateGoal)}%` 
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                ゴール: {metrics.goals.successRateGoal}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均実行時間</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(metrics.overview.averageExecutionTime / 60)}分
                </p>
                {renderTrend(metrics.trends.timeTrend, true)}
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500">
                ゴール: {Math.round(metrics.goals.executionTimeGoal / 60)}分以下
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">エンゲージメント率</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics.overview.engagementRate.toFixed(1)}%
                </p>
                {renderTrend(metrics.trends.engagementTrend)}
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${calculateGoalProgress(metrics.overview.engagementRate, metrics.goals.engagementGoal)}%` 
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                ゴール: {metrics.goals.engagementGoal}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">生成コンテンツ数</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics.overview.totalContentGenerated.toLocaleString()}
                </p>
                {renderTrend(metrics.trends.workflowTrend)}
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500">
                ゴール: {metrics.goals.contentVolumeGoal.toLocaleString()}件/月
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* タブコンテンツ */}
      <Tabs defaultValue="charts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="charts">チャート分析</TabsTrigger>
          <TabsTrigger value="goals">ゴール管理</TabsTrigger>
          <TabsTrigger value="alerts">アラート</TabsTrigger>
          <TabsTrigger value="insights">インサイト</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          {/* パフォーマンスチャート */}
          <PerformanceChart 
            data={timeSeriesData} 
            timeRange={timeRange}
            className="lg:col-span-2"
          />
          
          {/* 詳細分析チャート */}
          <div className="grid gap-6 lg:grid-cols-2">
            <WorkflowStatsChart 
              data={timeSeriesData.map(d => ({
                date: d.date,
                total: d.workflows,
                completed: Math.round(d.workflows * d.success_rate / 100),
                failed: Math.round(d.workflows * (100 - d.success_rate) / 100),
                running: 0,
                avgTime: d.avg_time
              }))}
              chartType="area"
            />
            
            <Card>
              <CardHeader>
                <CardTitle>メトリクス詳細</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">コンバージョン率</span>
                    <span className="text-lg font-bold">{metrics.overview.conversionRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">総ワークフロー数</span>
                    <span className="text-lg font-bold">{metrics.overview.totalWorkflows}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">平均実行時間</span>
                    <span className="text-lg font-bold">{Math.round(metrics.overview.averageExecutionTime)}秒</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>パフォーマンスゴール</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">成功率</span>
                      <span className="text-sm text-gray-600">
                        {metrics.overview.successRate.toFixed(1)}% / {metrics.goals.successRateGoal}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${calculateGoalProgress(metrics.overview.successRate, metrics.goals.successRateGoal)}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">実行時間</span>
                      <span className="text-sm text-gray-600">
                        {Math.round(metrics.overview.averageExecutionTime / 60)}分 / {Math.round(metrics.goals.executionTimeGoal / 60)}分
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((metrics.goals.executionTimeGoal / metrics.overview.averageExecutionTime) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">エンゲージメント率</span>
                      <span className="text-sm text-gray-600">
                        {metrics.overview.engagementRate.toFixed(1)}% / {metrics.goals.engagementGoal}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${calculateGoalProgress(metrics.overview.engagementRate, metrics.goals.engagementGoal)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>トップパフォーマー</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.topPerformers.map((performer, index) => (
                    <div key={performer.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full mr-3">
                          <Award className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium">{performer.name}</p>
                          <p className="text-sm text-gray-600">{performer.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{performer.performance.toFixed(1)}%</p>
                        {renderTrend(performer.improvement)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="grid gap-4">
            {metrics.alerts.length > 0 ? (
              metrics.alerts.map((alert) => {
                const Icon = getAlertIcon(alert.type);
                const colorClass = getAlertColor(alert.type);
                
                return (
                  <Card key={alert.id} className="border-l-4" style={{
                    borderLeftColor: alert.type === 'success' ? '#10b981' : 
                                    alert.type === 'warning' ? '#f59e0b' : 
                                    alert.type === 'error' ? '#ef4444' : '#3b82f6'
                  }}>
                    <CardContent className="p-4">
                      <div className="flex items-start">
                        <div className={`p-2 rounded-full mr-3 ${colorClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{alert.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">アラートはありません</h3>
                <p className="text-gray-600">すべてのメトリクスが正常範囲内です</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-4">
            {metrics.insights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Badge 
                          variant="outline" 
                          className={
                            insight.impact === 'high' ? 'border-red-200 text-red-700' :
                            insight.impact === 'medium' ? 'border-yellow-200 text-yellow-700' :
                            'border-green-200 text-green-700'
                          }
                        >
                          {insight.impact === 'high' ? '高影響' :
                           insight.impact === 'medium' ? '中影響' : '低影響'}
                        </Badge>
                        <Badge variant="outline" className="ml-2">
                          {insight.category}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2">{insight.title}</h3>
                      <p className="text-sm text-gray-600">{insight.description}</p>
                    </div>
                    {insight.actionable && (
                      <Button variant="outline" size="sm" className="ml-4">
                        アクション
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}