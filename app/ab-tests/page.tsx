'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Play, 
  Pause, 
  Square, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Users,
  Target,
  Trophy,
  Eye,
  Settings,
  Calendar,
  Activity
} from 'lucide-react';

// A/Bテストの型定義
interface ABTest {
  id: string;
  name: string;
  testType: 'content' | 'template' | 'strategy' | 'copy';
  status: 'draft' | 'running' | 'completed' | 'paused';
  description: string;
  variants: Variant[];
  metrics: TestMetrics;
  startDate: string;
  endDate: string | null;
  trafficSplit: { variantA: number; variantB: number };
  significance: number;
  winner: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Variant {
  id: string;
  name: string;
  content: any;
  metrics: {
    visitors: number;
    conversions: number;
    conversionRate: string;
  };
}

interface TestMetrics {
  totalVisitors: number;
  totalConversions: number;
  averageConversionRate: string;
  statisticalSignificance: 'significant' | 'not_significant';
  confidence: number;
}

// テストタイプの設定
const TEST_TYPES = {
  content: { name: 'コンテンツ', icon: '📝', color: 'bg-blue-100 text-blue-800' },
  template: { name: 'テンプレート', icon: '📋', color: 'bg-green-100 text-green-800' },
  strategy: { name: '戦略', icon: '🎯', color: 'bg-purple-100 text-purple-800' },
  copy: { name: 'コピー', icon: '✍️', color: 'bg-orange-100 text-orange-800' }
};

export default function ABTestsPage() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ status: string; type: string }>({
    status: '',
    type: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // データ取得
  useEffect(() => {
    fetchABTests();
  }, [filter]);

  const fetchABTests = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (filter.status) queryParams.append('status', filter.status);
      if (filter.type) queryParams.append('type', filter.type);
      
      const response = await fetch(`/api/ab-tests?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch A/B tests');
      }
      
      const data = await response.json();
      setTests(data.tests || []);
      
    } catch (error) {
      console.error('Failed to fetch A/B tests:', error);
    } finally {
      setLoading(false);
    }
  };

  // A/Bテスト作成
  const createNewTest = () => {
    // A/Bテスト作成モーダルまたはページに遷移
    window.location.href = '/ab-tests/create';
  };

  // テスト開始
  const startTest = async (testId: string) => {
    try {
      const response = await fetch(`/api/ab-tests/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });

      if (!response.ok) {
        throw new Error('Failed to start test');
      }

      await fetchABTests();
    } catch (error) {
      console.error('Failed to start test:', error);
    }
  };

  // テスト停止
  const stopTest = async (testId: string) => {
    try {
      const response = await fetch(`/api/ab-tests/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });

      if (!response.ok) {
        throw new Error('Failed to stop test');
      }

      await fetchABTests();
    } catch (error) {
      console.error('Failed to stop test:', error);
    }
  };

  // フィルタリング
  const filteredTests = tests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // ステータスの色とアイコン
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

  // 勝者の表示
  const getWinnerDisplay = (test: ABTest) => {
    if (!test.winner) return null;
    
    const variant = test.variants.find(v => v.id === test.winner);
    if (!variant) return null;
    
    return (
      <div className="flex items-center text-green-600">
        <Trophy className="w-4 h-4 mr-1" />
        <span className="text-sm font-medium">{variant.name}</span>
      </div>
    );
  };

  // 統計情報の計算
  const getOverallStats = () => {
    const total = tests.length;
    const running = tests.filter(t => t.status === 'running').length;
    const completed = tests.filter(t => t.status === 'completed').length;
    const significant = tests.filter(t => t.metrics.statisticalSignificance === 'significant').length;
    
    return { total, running, completed, significant };
  };

  const stats = getOverallStats();

  if (loading) {
    return (
      <div className="container-responsive py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive py-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-responsive-xl font-bold text-gray-900">A/Bテスト</h1>
          <p className="text-gray-600">
            コンテンツとテンプレートの効果を検証し、最適化
          </p>
        </div>
        
        <Button onClick={createNewTest}>
          <Plus className="w-4 h-4 mr-2" />
          新規A/Bテスト
        </Button>
      </div>

      {/* 統計サマリー */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総テスト数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">実行中</p>
                <p className="text-2xl font-bold text-gray-900">{stats.running}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">完了</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">有意差あり</p>
                <p className="text-2xl font-bold text-gray-900">{stats.significant}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* フィルターと検索 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="テスト名または説明で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全てのステータス</option>
                <option value="draft">下書き</option>
                <option value="running">実行中</option>
                <option value="completed">完了</option>
                <option value="paused">一時停止</option>
              </select>
              
              <select
                value={filter.type}
                onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全てのタイプ</option>
                <option value="content">コンテンツ</option>
                <option value="template">テンプレート</option>
                <option value="strategy">戦略</option>
                <option value="copy">コピー</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* A/Bテスト一覧 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {filteredTests.length === 0 ? (
          <div className="lg:col-span-2 text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              A/Bテストがありません
            </h3>
            <p className="text-gray-600 mb-6">
              新しいA/Bテストを作成して、コンテンツの効果を検証しましょう。
            </p>
            <Button onClick={createNewTest}>
              <Plus className="w-4 h-4 mr-2" />
              新規A/Bテスト作成
            </Button>
          </div>
        ) : (
          filteredTests.map((test) => {
            const statusConfig = getStatusConfig(test.status);
            const testTypeConfig = TEST_TYPES[test.testType];
            const StatusIcon = statusConfig.icon;
            
            return (
              <Card key={test.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={testTypeConfig.color}>
                          {testTypeConfig.icon} {testTypeConfig.name}
                        </Badge>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.text}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mb-1">{test.name}</CardTitle>
                      <p className="text-sm text-gray-600">{test.description}</p>
                    </div>
                    
                    <div className="flex gap-1 ml-4">
                      {test.status === 'draft' && (
                        <Button 
                          size="sm" 
                          onClick={() => startTest(test.id)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {test.status === 'running' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => stopTest(test.id)}
                        >
                          <Square className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => window.location.href = `/ab-tests/${test.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* バリアント比較 */}
                  <div className="grid grid-cols-2 gap-4">
                    {test.variants.slice(0, 2).map((variant) => (
                      <div key={variant.id} className="bg-gray-50 p-3 rounded">
                        <h4 className="font-medium text-sm mb-2">{variant.name}</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>訪問者</span>
                            <span className="font-medium">{variant.metrics.visitors.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>コンバージョン</span>
                            <span className="font-medium">{variant.metrics.conversions}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>CV率</span>
                            <span className="font-medium">{variant.metrics.conversionRate}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 総合メトリクス */}
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">総訪問者数</p>
                        <p className="font-medium">{test.metrics.totalVisitors.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">平均CV率</p>
                        <p className="font-medium">{test.metrics.averageConversionRate}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">信頼度</p>
                        <div className="flex items-center">
                          <Progress value={test.metrics.confidence} className="h-2 flex-1 mr-2" />
                          <span className="font-medium text-xs">{test.metrics.confidence}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600">勝者</p>
                        {getWinnerDisplay(test) || <span className="text-sm text-gray-500">未確定</span>}
                      </div>
                    </div>
                  </div>

                  {/* 期間情報 */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>
                        {new Date(test.startDate).toLocaleDateString('ja-JP')}
                        {test.endDate && ` - ${new Date(test.endDate).toLocaleDateString('ja-JP')}`}
                      </span>
                    </div>
                    
                    {test.metrics.statisticalSignificance === 'significant' && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        統計的有意
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}