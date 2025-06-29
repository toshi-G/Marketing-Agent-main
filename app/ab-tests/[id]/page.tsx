'use client'

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Square, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  Target,
  Trophy,
  Activity,
  Calendar,
  Monitor,
  Smartphone,
  Tablet,
  ArrowLeft,
  Download,
  Settings,
  AlertTriangle,
  CheckCircle,
  Eye
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

// A/Bテスト詳細の型定義
interface ABTestDetail {
  id: string;
  name: string;
  description: string;
  testType: string;
  status: string;
  variants: DetailedVariant[];
  trafficSplit: { variantA: number; variantB: number };
  goals: string[];
  duration: number;
  startDate: string;
  endDate: string | null;
  metrics: DetailedMetrics;
  timeline: TimelineData[];
  segmentAnalysis: SegmentAnalysis;
  insights: TestInsight[];
  createdAt: string;
  updatedAt: string;
}

interface DetailedVariant {
  id: string;
  name: string;
  description: string;
  content: any;
  weight: number;
  metrics: {
    visitors: number;
    conversions: number;
    conversionRate: string;
    bounceRate: string;
    timeOnPage: number;
    engagementRate: string;
  };
}

interface DetailedMetrics {
  overview: {
    totalVisitors: number;
    totalConversions: number;
    averageConversionRate: string;
    improvement: string;
    winner: string | null;
  };
  statistical: {
    significance: string;
    confidence: number;
    pValue: string;
    effect_size: string;
  };
  comparison: {
    conversionRate: { variantA: string; variantB: string; lift: string };
    engagement: { variantA: string; variantB: string; lift: string };
    bounceRate: { variantA: string; variantB: string; lift: string };
  };
}

interface TimelineData {
  date: string;
  variantA: { visitors: number; conversions: number; conversionRate: string };
  variantB: { visitors: number; conversions: number; conversionRate: string };
}

interface SegmentAnalysis {
  device: Record<string, any>;
  traffic_source: Record<string, any>;
}

interface TestInsight {
  type: string;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
}

export default function ABTestDetailPage() {
  const params = useParams();
  const testId = params.id as string;
  
  const [testData, setTestData] = useState<ABTestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // データ取得
  useEffect(() => {
    if (testId) {
      fetchTestDetail();
    }
  }, [testId]);

  const fetchTestDetail = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/ab-tests/${testId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch test detail');
      }
      
      const data = await response.json();
      setTestData(data);
      
    } catch (error) {
      console.error('Failed to fetch test detail:', error);
    } finally {
      setLoading(false);
    }
  };

  // テスト制御
  const handleTestAction = async (action: string) => {
    try {
      setSubmitting(true);
      
      const response = await fetch(`/api/ab-tests/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} test`);
      }

      await fetchTestDetail();
    } catch (error) {
      console.error(`Failed to ${action} test:`, error);
    } finally {
      setSubmitting(false);
    }
  };

  // 統計的有意性の表示
  const getSignificanceDisplay = (significance: string, confidence: number) => {
    if (significance === 'significant') {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle className="w-4 h-4 mr-1" />
          <span className="font-medium">統計的有意 ({confidence}%)</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-yellow-600">
          <AlertTriangle className="w-4 h-4 mr-1" />
          <span className="font-medium">データ収集中 ({confidence}%)</span>
        </div>
      );
    }
  };

  // 改善率の表示
  const getImprovementDisplay = (improvement: string) => {
    const value = parseFloat(improvement);
    const isPositive = value > 0;
    
    return (
      <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
        <span className="font-medium">{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  // ステータス設定
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'running':
        return { color: 'bg-green-100 text-green-800', icon: Activity, text: '実行中' };
      case 'completed':
        return { color: 'bg-blue-100 text-blue-800', icon: Trophy, text: '完了' };
      case 'paused':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Pause, text: '一時停止' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: Settings, text: '下書き' };
    }
  };

  if (loading) {
    return (
      <div className="container-responsive py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="container-responsive py-8">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            A/Bテストが見つかりません
          </h2>
          <p className="text-gray-600">
            指定されたA/Bテストは存在しないか、削除されている可能性があります。
          </p>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(testData.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="container-responsive py-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = '/ab-tests'}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={statusConfig.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.text}
              </Badge>
              {getSignificanceDisplay(testData.metrics.statistical.significance, testData.metrics.statistical.confidence)}
            </div>
            <h1 className="text-responsive-xl font-bold text-gray-900">{testData.name}</h1>
            <p className="text-gray-600">{testData.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {testData.status === 'draft' && (
            <Button 
              onClick={() => handleTestAction('start')}
              disabled={submitting}
            >
              <Play className="w-4 h-4 mr-2" />
              テスト開始
            </Button>
          )}
          
          {testData.status === 'running' && (
            <>
              <Button 
                variant="outline"
                onClick={() => handleTestAction('pause')}
                disabled={submitting}
              >
                <Pause className="w-4 h-4 mr-2" />
                一時停止
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleTestAction('stop')}
                disabled={submitting}
              >
                <Square className="w-4 h-4 mr-2" />
                停止
              </Button>
            </>
          )}
          
          {testData.status === 'paused' && (
            <Button 
              onClick={() => handleTestAction('resume')}
              disabled={submitting}
            >
              <Play className="w-4 h-4 mr-2" />
              再開
            </Button>
          )}
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            レポート
          </Button>
        </div>
      </div>

      {/* 概要メトリクス */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総訪問者</p>
                <p className="text-2xl font-bold text-gray-900">
                  {testData.metrics.overview.totalVisitors.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総コンバージョン</p>
                <p className="text-2xl font-bold text-gray-900">
                  {testData.metrics.overview.totalConversions.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">平均CV率</p>
                <p className="text-2xl font-bold text-gray-900">
                  {testData.metrics.overview.averageConversionRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">改善率</p>
                <div className="text-2xl font-bold">
                  {getImprovementDisplay(testData.metrics.overview.improvement)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">勝者</p>
                <p className="text-xl font-bold text-gray-900">
                  {testData.metrics.overview.winner ? 
                    testData.variants.find(v => v.id === testData.metrics.overview.winner)?.name || '未確定' : 
                    '未確定'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 詳細タブ */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="variants">バリアント</TabsTrigger>
          <TabsTrigger value="timeline">時系列</TabsTrigger>
          <TabsTrigger value="segments">セグメント</TabsTrigger>
          <TabsTrigger value="insights">インサイト</TabsTrigger>
        </TabsList>
        
        {/* 概要タブ */}
        <TabsContent value="overview" className="space-y-6">
          {/* バリアント比較 */}
          <Card>
            <CardHeader>
              <CardTitle>バリアント比較</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {testData.variants.map((variant) => (
                  <div key={variant.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-lg">{variant.name}</h3>
                      <Badge variant="outline">{variant.weight}% トラフィック</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">訪問者数</p>
                        <p className="text-xl font-bold">{variant.metrics.visitors.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">コンバージョン</p>
                        <p className="text-xl font-bold">{variant.metrics.conversions}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">CV率</p>
                        <p className="text-xl font-bold text-green-600">{variant.metrics.conversionRate}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">直帰率</p>
                        <p className="text-xl font-bold">{variant.metrics.bounceRate}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">滞在時間</p>
                        <p className="text-xl font-bold">{Math.floor(variant.metrics.timeOnPage / 60)}:{(variant.metrics.timeOnPage % 60).toString().padStart(2, '0')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">エンゲージメント</p>
                        <p className="text-xl font-bold">{variant.metrics.engagementRate}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 統計的有意性 */}
          <Card>
            <CardHeader>
              <CardTitle>統計分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">信頼度</p>
                  <div className="relative">
                    <Progress value={testData.metrics.statistical.confidence} className="h-3 mb-2" />
                    <p className="text-lg font-bold">{testData.metrics.statistical.confidence}%</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">P値</p>
                  <p className="text-lg font-bold">{testData.metrics.statistical.pValue}</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">効果サイズ</p>
                  <p className="text-lg font-bold">{testData.metrics.statistical.effect_size}</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">有意性</p>
                  {getSignificanceDisplay(testData.metrics.statistical.significance, testData.metrics.statistical.confidence)}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* バリアントタブ */}
        <TabsContent value="variants" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {testData.variants.map((variant) => (
              <Card key={variant.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{variant.name}</span>
                    <Badge variant="outline">{variant.weight}%</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">{variant.description}</p>
                  
                  {/* コンテンツプレビュー */}
                  <div className="bg-gray-50 p-4 rounded border">
                    <h4 className="font-medium mb-2">コンテンツ</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">ヘッドライン:</span>
                        <p className="ml-2">{variant.content.headline}</p>
                      </div>
                      <div>
                        <span className="font-medium">サブヘッドライン:</span>
                        <p className="ml-2">{variant.content.subheadline}</p>
                      </div>
                      <div>
                        <span className="font-medium">CTA:</span>
                        <p className="ml-2">{variant.content.cta}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* パフォーマンス */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-blue-600 font-medium">コンバージョン率</p>
                      <p className="text-2xl font-bold text-blue-800">{variant.metrics.conversionRate}%</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-green-600 font-medium">エンゲージメント</p>
                      <p className="text-2xl font-bold text-green-800">{variant.metrics.engagementRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 時系列タブ */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>時系列パフォーマンス</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={testData.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="variantA.conversionRate" 
                    stroke="#3b82f6" 
                    name="バリアントA CV率"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="variantB.conversionRate" 
                    stroke="#10b981" 
                    name="バリアントB CV率"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* セグメントタブ */}
        <TabsContent value="segments" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* デバイス別 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="w-5 h-5 mr-2" />
                  デバイス別パフォーマンス
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(testData.segmentAnalysis.device).map(([device, data]: [string, any]) => {
                    const deviceIcons = {
                      desktop: Monitor,
                      mobile: Smartphone,
                      tablet: Tablet
                    };
                    const DeviceIcon = deviceIcons[device as keyof typeof deviceIcons] || Monitor;
                    
                    return (
                      <div key={device} className="border rounded p-3">
                        <div className="flex items-center mb-2">
                          <DeviceIcon className="w-4 h-4 mr-2" />
                          <span className="font-medium capitalize">{device}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">バリアントA</p>
                            <p className="font-bold">{data.variantA.conversionRate}% ({data.variantA.visitors}人)</p>
                          </div>
                          <div>
                            <p className="text-gray-600">バリアントB</p>
                            <p className="font-bold">{data.variantB.conversionRate}% ({data.variantB.visitors}人)</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 流入元別 */}
            <Card>
              <CardHeader>
                <CardTitle>流入元別パフォーマンス</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(testData.segmentAnalysis.traffic_source).map(([source, data]: [string, any]) => (
                    <div key={source} className="border rounded p-3">
                      <div className="flex items-center mb-2">
                        <span className="font-medium capitalize">{source}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">バリアントA</p>
                          <p className="font-bold">{data.variantA.conversionRate}% ({data.variantA.visitors}人)</p>
                        </div>
                        <div>
                          <p className="text-gray-600">バリアントB</p>
                          <p className="font-bold">{data.variantB.conversionRate}% ({data.variantB.visitors}人)</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* インサイトタブ */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-4">
            {testData.insights.map((insight, index) => {
              const impactColors = {
                high: 'border-red-200 bg-red-50',
                medium: 'border-yellow-200 bg-yellow-50',
                low: 'border-green-200 bg-green-50'
              };
              
              return (
                <Card key={index} className={impactColors[insight.impact as keyof typeof impactColors]}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Badge variant="outline" className="mr-2">
                            {insight.type}
                          </Badge>
                          <Badge 
                            className={
                              insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                              insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }
                          >
                            {insight.impact === 'high' ? '高' : insight.impact === 'medium' ? '中' : '低'}影響
                          </Badge>
                        </div>
                        <h3 className="font-medium text-lg mb-2">{insight.title}</h3>
                        <p className="text-gray-600 mb-3">{insight.description}</p>
                        <div className="bg-white p-3 rounded border">
                          <p className="text-sm font-medium text-blue-800">
                            💡 推奨アクション: {insight.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}