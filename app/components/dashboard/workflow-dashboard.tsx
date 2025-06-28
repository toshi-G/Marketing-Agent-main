'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { DashboardData, WorkflowStatus } from '@/app/lib/api/types';
import { MarketResearchChart } from './market-research-chart';
import { ContentAnalysisChart } from './content-analysis-chart';
import { TemplateOptimizationChart } from './template-optimization-chart';
import { BusinessStrategyChart } from './business-strategy-chart';
import { exportDataAsJSON, exportDataAsCSV } from '@/app/lib/utils/visualization';
import { Download, Eye, FileText, BarChart3, Target, DollarSign, Copy, CheckCircle, XCircle, Clock } from 'lucide-react';

interface WorkflowDashboardProps {
  data: DashboardData;
  className?: string;
}

export function WorkflowDashboard({ data, className = '' }: WorkflowDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');

  const getStatusIcon = (status: WorkflowStatus) => {
    switch (status) {
      case WorkflowStatus.COMPLETED:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case WorkflowStatus.FAILED:
        return <XCircle className="w-5 h-5 text-red-500" />;
      case WorkflowStatus.RUNNING:
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: WorkflowStatus) => {
    const statusConfig = {
      [WorkflowStatus.COMPLETED]: { label: '完了', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      [WorkflowStatus.FAILED]: { label: 'エラー', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
      [WorkflowStatus.RUNNING]: { label: '実行中', variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' },
      [WorkflowStatus.PENDING]: { label: '待機中', variant: 'outline' as const, className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatProcessingTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}時間${minutes % 60}分`;
    } else if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  const handleExport = (format: 'json' | 'csv', dataType: 'all' | 'templates' | 'content' | 'analytics') => {
    let exportData;
    let filename;

    switch (dataType) {
      case 'templates':
        exportData = data.exportData.templates;
        filename = `${data.workflowName}_templates`;
        break;
      case 'content':
        exportData = data.exportData.content;
        filename = `${data.workflowName}_content`;
        break;
      case 'analytics':
        exportData = data.exportData.analytics;
        filename = `${data.workflowName}_analytics`;
        break;
      default:
        exportData = data;
        filename = `${data.workflowName}_full_data`;
    }

    if (format === 'json') {
      exportDataAsJSON(exportData, filename);
    } else {
      // CSVの場合は配列データのみ対応
      if (Array.isArray(exportData)) {
        exportDataAsCSV(exportData, filename);
      } else {
        // オブジェクトの場合は平坦化して配列に変換
        const flattenedData = Object.entries(exportData).map(([key, value]) => ({
          key,
          value: typeof value === 'object' ? JSON.stringify(value) : value
        }));
        exportDataAsCSV(flattenedData, filename);
      }
    }
  };

  const tabs = [
    { id: 'overview', label: '概要', icon: Eye },
    { id: 'market', label: '市場調査', icon: Target },
    { id: 'content', label: 'コンテンツ分析', icon: FileText },
    { id: 'templates', label: 'テンプレート', icon: Copy },
    { id: 'business', label: 'ビジネス戦略', icon: DollarSign },
    { id: 'export', label: 'エクスポート', icon: Download }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                {getStatusIcon(data.status)}
                {data.workflowName}
              </CardTitle>
              <CardDescription className="mt-2">
                ワークフローID: {data.workflowId}
                {data.completedAt && (
                  <span className="ml-4">完了日時: {new Date(data.completedAt).toLocaleString('ja-JP')}</span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(data.status)}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* サマリー統計 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {data.summary.completedAgents}/{data.summary.totalAgents}
                </p>
                <p className="text-sm text-gray-500">完了エージェント</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {data.summary.successRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">成功率</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {formatProcessingTime(data.summary.processingTime)}
                </p>
                <p className="text-sm text-gray-500">処理時間</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Download className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {data.exportData.templates.length + data.exportData.content.length}
                </p>
                <p className="text-sm text-gray-500">生成アセット数</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* タブナビゲーション */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* タブコンテンツ */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <Card>
            <CardHeader>
              <CardTitle>ワークフロー概要</CardTitle>
              <CardDescription>全エージェントの処理結果サマリー</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.visualization.marketResearch && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">市場調査</h4>
                      <p className="text-sm text-gray-600">
                        {data.visualization.marketResearch.genres?.length || 0}個のジャンル分析完了
                      </p>
                    </div>
                  )}
                  {data.visualization.contentAnalysis && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">コンテンツ分析</h4>
                      <p className="text-sm text-gray-600">
                        {data.visualization.contentAnalysis.platformStats?.length || 0}プラットフォーム分析
                      </p>
                    </div>
                  )}
                  {data.visualization.templateOptimization && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">テンプレート最適化</h4>
                      <p className="text-sm text-gray-600">
                        {data.visualization.templateOptimization.templates?.length || 0}個のテンプレート生成
                      </p>
                    </div>
                  )}
                  {data.visualization.businessStrategy && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">ビジネス戦略</h4>
                      <p className="text-sm text-gray-600">
                        {data.visualization.businessStrategy.productLineup?.length || 0}商品ライン設計
                      </p>
                    </div>
                  )}
                  {data.visualization.contentCreation && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">コンテンツ生成</h4>
                      <p className="text-sm text-gray-600">
                        {data.visualization.contentCreation.contentTypes?.length || 0}種類のコンテンツ
                      </p>
                    </div>
                  )}
                  {data.visualization.copyGeneration && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">コピー生成</h4>
                      <p className="text-sm text-gray-600">
                        {data.visualization.copyGeneration.hookCategories?.reduce((sum, cat) => sum + cat.count, 0) || 0}個のフック生成
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'market' && (
          <MarketResearchChart data={data.visualization.marketResearch} />
        )}

        {activeTab === 'content' && (
          <ContentAnalysisChart data={data.visualization.contentAnalysis} />
        )}

        {activeTab === 'templates' && (
          <TemplateOptimizationChart data={data.visualization.templateOptimization} />
        )}

        {activeTab === 'business' && (
          <BusinessStrategyChart data={data.visualization.businessStrategy} />
        )}

        {activeTab === 'export' && (
          <Card>
            <CardHeader>
              <CardTitle>データエクスポート</CardTitle>
              <CardDescription>ワークフロー結果データを様々な形式でエクスポート</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* JSON エクスポート */}
                  <div className="space-y-4">
                    <h4 className="font-medium">JSON形式でエクスポート</h4>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => handleExport('json', 'all')}
                        className="w-full justify-start"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        全データ (JSON)
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleExport('json', 'templates')}
                        className="w-full justify-start"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        テンプレートのみ (JSON)
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleExport('json', 'content')}
                        className="w-full justify-start"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        コンテンツのみ (JSON)
                      </Button>
                    </div>
                  </div>

                  {/* CSV エクスポート */}
                  <div className="space-y-4">
                    <h4 className="font-medium">CSV形式でエクスポート</h4>
                    <div className="space-y-2">
                      <Button 
                        variant="outline"
                        onClick={() => handleExport('csv', 'analytics')}
                        className="w-full justify-start"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        分析データ (CSV)
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleExport('csv', 'templates')}
                        className="w-full justify-start"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        テンプレート (CSV)
                      </Button>
                    </div>
                  </div>
                </div>

                {/* エクスポート統計 */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">エクスポート可能データ</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {data.exportData.templates.length}
                      </p>
                      <p className="text-sm text-gray-500">テンプレート</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {data.exportData.content.length}
                      </p>
                      <p className="text-sm text-gray-500">コンテンツ</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        {data.exportData.analytics.length}
                      </p>
                      <p className="text-sm text-gray-500">分析レポート</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}