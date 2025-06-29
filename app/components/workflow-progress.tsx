'use client'

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useWorkflowProgress } from '@/hooks/use-workflow-progress';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  TrendingUp,
  Target,
  Brain,
  FileText,
  Zap,
  Megaphone,
  Archive,
  Globe
} from 'lucide-react';

interface WorkflowProgressProps {
  workflowId: string;
  className?: string;
}

// エージェントタイプとアイコンのマッピング
const AGENT_CONFIG = {
  market_research: {
    name: '市場調査',
    icon: TrendingUp,
    description: 'トレンドと収益性を分析中'
  },
  content_scraping: {
    name: 'コンテンツ収集',
    icon: Globe,
    description: 'SNSから高反応フレーズを抽出中'
  },
  nlp_classification: {
    name: 'NLP分類',
    icon: Brain,
    description: '訴求タイプ・感情別に分類中'
  },
  template_optimization: {
    name: 'テンプレート最適化',
    icon: Target,
    description: '高成功率パターンを選出中'
  },
  business_strategy: {
    name: '商品設計',
    icon: Zap,
    description: '商品構成とファネルを設計中'
  },
  content_creation: {
    name: 'コンテンツ生成',
    icon: FileText,
    description: 'LP・SNS・メールを生成中'
  },
  copy_generation: {
    name: 'コピー生成',
    icon: Megaphone,
    description: 'フックとコピーを量産中'
  },
  optimization_archive: {
    name: '最適化・保存',
    icon: Archive,
    description: '成功パターンを保存中'
  }
} as const;

const getStatusIcon = (status: string, isActive: boolean = false) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'running':
      return <RefreshCw className={`w-5 h-5 text-blue-500 ${isActive ? 'animate-spin' : ''}`} />;
    case 'failed':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'pending':
    default:
      return <Circle className="w-5 h-5 text-gray-300" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'running':
      return 'bg-blue-500';
    case 'failed':
      return 'bg-red-500';
    case 'pending':
    default:
      return 'bg-gray-300';
  }
};

export function WorkflowProgress({ workflowId, className = '' }: WorkflowProgressProps) {
  const {
    workflow,
    currentStep,
    totalSteps,
    isRunning,
    progress,
    currentAgent,
    error,
    lastUpdated,
    refresh
  } = useWorkflowProgress({ workflowId });

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            エラーが発生しました
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={refresh}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            再試行
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!workflow) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <Spinner className="w-8 h-8 mr-3" />
          <span>ワークフローを読み込み中...</span>
        </CardContent>
      </Card>
    );
  }

  const agents = workflow.agents?.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  ) || [];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <div className="flex items-center mr-3">
              {isRunning ? (
                <RefreshCw className="w-5 h-5 text-blue-500 animate-spin mr-2" />
              ) : workflow.status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              ) : workflow.status === 'failed' ? (
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              ) : (
                <Clock className="w-5 h-5 text-gray-500 mr-2" />
              )}
              ワークフロー進捗
            </div>
            <Badge variant={
              workflow.status === 'completed' ? 'default' :
              workflow.status === 'running' ? 'secondary' :
              workflow.status === 'failed' ? 'destructive' : 'outline'
            }>
              {workflow.status === 'completed' ? '完了' :
               workflow.status === 'running' ? '実行中' :
               workflow.status === 'failed' ? '失敗' : '待機中'}
            </Badge>
          </CardTitle>
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              最終更新: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      
        {/* 全体進捗バー */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              ステップ {currentStep} / {totalSteps}
            </span>
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* 現在実行中のエージェント */}
        {currentAgent && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center">
              {currentAgent.type && AGENT_CONFIG[currentAgent.type as keyof typeof AGENT_CONFIG] && (
                <>
                  {React.createElement(
                    AGENT_CONFIG[currentAgent.type as keyof typeof AGENT_CONFIG].icon,
                    { className: "w-5 h-5 text-blue-600 mr-3" }
                  )}
                  <div>
                    <h4 className="font-medium text-blue-900">
                      {AGENT_CONFIG[currentAgent.type as keyof typeof AGENT_CONFIG].name}
                    </h4>
                    <p className="text-sm text-blue-700">
                      {AGENT_CONFIG[currentAgent.type as keyof typeof AGENT_CONFIG].description}
                    </p>
                  </div>
                </>
              )}
              {currentAgent.status === 'running' && (
                <Spinner className="w-4 h-4 ml-auto text-blue-600" />
              )}
            </div>
          </div>
        )}

        {/* エージェント一覧 */}
        <div className="space-y-3">
          {agents.map((agent, index) => {
            const config = AGENT_CONFIG[agent.type as keyof typeof AGENT_CONFIG];
            const isActive = currentAgent?.id === agent.id;
            
            return (
              <div 
                key={agent.id}
                className={`flex items-center p-3 rounded-lg border transition-all ${
                  isActive ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mr-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    getStatusColor(agent.status)
                  }`}>
                    {index + 1}
                  </div>
                </div>

                <div className="flex items-center flex-1">
                  {config && React.createElement(config.icon, { 
                    className: "w-5 h-5 text-gray-600 mr-3" 
                  })}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {config?.name || agent.type}
                    </h4>
                    {agent.status === 'running' && (
                      <p className="text-sm text-gray-600">
                        {config?.description || '処理中...'}
                      </p>
                    )}
                    {agent.status === 'failed' && agent.error && (
                      <p className="text-sm text-red-600">
                        エラー: {agent.error}
                      </p>
                    )}
                    {agent.completedAt && (
                      <p className="text-sm text-gray-500">
                        完了: {new Date(agent.completedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="ml-4">
                  {getStatusIcon(agent.status, isActive)}
                </div>
              </div>
            );
          })}
        </div>

        {/* リフレッシュボタン */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={refresh}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            更新
          </button>
        </div>
      </CardContent>
    </Card>
  );
}