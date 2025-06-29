'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  PieChart,
  Share2,
  Copy,
  RefreshCw
} from 'lucide-react';
import { ContentGallery } from '@/components/content/content-gallery';

// ワークフロー結果データの型定義
interface WorkflowResult {
  id: string;
  name: string;
  status: 'completed' | 'failed' | 'running';
  createdAt: string;
  completedAt: string | null;
  agents: AgentResult[];
  summary?: {
    totalAgents: number;
    completedAgents: number;
    executionTime: number;
    successRate: number;
  };
}

interface AgentResult {
  id: string;
  type: string;
  status: 'completed' | 'failed' | 'running';
  startedAt: string;
  completedAt: string | null;
  executionTime: number;
  output: any;
  error?: string;
}

// エージェント設定
const AGENT_CONFIG = {
  market_research: {
    name: '市場調査エージェント',
    description: '収益性の高い市場ジャンルとトレンドを特定',
    icon: BarChart3,
    color: 'blue'
  },
  content_scraping: {
    name: 'コンテンツスクレイピングエージェント', 
    description: 'SNSから高エンゲージメントフレーズを抽出',
    icon: PieChart,
    color: 'green'
  },
  nlp_classification: {
    name: 'NLP分類エージェント',
    description: '訴求タイプ・感情・構造別にコンテンツを分類',
    icon: FileText,
    color: 'purple'
  },
  template_optimization: {
    name: 'テンプレート最適化エージェント',
    description: '高成功率のコンテンツテンプレートを作成',
    icon: CheckCircle,
    color: 'orange'
  },
  business_strategy: {
    name: '商品設計エージェント',
    description: '商品ラインナップとセールスファネルを設計',
    icon: BarChart3,
    color: 'red'
  },
  content_creation: {
    name: 'コンテンツ生成エージェント',
    description: 'LP・SNS投稿・メールシーケンスを生成',
    icon: FileText,
    color: 'indigo'
  },
  copy_generation: {
    name: 'コピー生成エージェント',
    description: 'フック（煽り・共感・逆張り系）を作成',
    icon: PieChart,
    color: 'pink'
  },
  optimization_archive: {
    name: '最適化・保存エージェント',
    description: '成功パターンを再利用可能テンプレートとして保存',
    icon: CheckCircle,
    color: 'teal'
  }
};

export default function WorkflowResultsPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;
  
  const [workflow, setWorkflow] = useState<WorkflowResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // ワークフロー結果を取得
  const fetchWorkflowResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workflows/${workflowId}/results`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch workflow results');
      }
      
      const data = await response.json();
      setWorkflow(data);
    } catch (error) {
      console.error('Failed to fetch workflow results:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workflowId) {
      fetchWorkflowResults();
    }
  }, [workflowId]);

  // データエクスポート
  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/export?format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow-${workflowId}-results.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // 結果共有
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('リンクがクリップボードにコピーされました');
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  // 実行時間のフォーマット
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  // ステータスの色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // エージェント出力のプレビュー
  const renderAgentOutput = (agent: AgentResult) => {
    try {
      const output = typeof agent.output === 'string' ? JSON.parse(agent.output) : agent.output;
      
      if (!output) return <p className="text-gray-500">出力データがありません</p>;

      return (
        <div className="space-y-3">
          {Object.entries(output).slice(0, 5).map(([key, value]) => (
            <div key={key} className="border-l-4 border-blue-200 pl-4">
              <h4 className="font-medium text-gray-900 capitalize">{key.replace(/_/g, ' ')}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {typeof value === 'object' 
                  ? JSON.stringify(value).substring(0, 200) + '...'
                  : String(value).substring(0, 200) + (String(value).length > 200 ? '...' : '')
                }
              </p>
            </div>
          ))}
          {Object.keys(output).length > 5 && (
            <p className="text-sm text-gray-500 italic">
              他 {Object.keys(output).length - 5} 件の出力項目...
            </p>
          )}
        </div>
      );
    } catch (error) {
      return <p className="text-gray-500">出力データの解析に失敗しました</p>;
    }
  };

  if (loading) {
    return (
      <div className="container-responsive py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="container-responsive py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ワークフローが見つかりません</h1>
          <Button onClick={() => router.push('/workflows')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            ワークフロー一覧に戻る
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
          <div className="flex items-center gap-3 mb-2">
            <Button 
              onClick={() => router.push('/workflows')} 
              variant="ghost" 
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              戻る
            </Button>
            <Badge className={getStatusColor(workflow.status)}>
              {workflow.status === 'completed' ? '完了' :
               workflow.status === 'failed' ? '失敗' : '実行中'}
            </Badge>
          </div>
          <h1 className="text-responsive-xl font-bold text-gray-900">{workflow.name}</h1>
          <p className="text-gray-600">
            作成: {new Date(workflow.createdAt).toLocaleString()}
            {workflow.completedAt && (
              <span className="ml-4">
                完了: {new Date(workflow.completedAt).toLocaleString()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={handleShare} variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            共有
          </Button>
          
          <div className="flex items-center gap-1">
            <Button onClick={() => handleExport('json')} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              JSON
            </Button>
            <Button onClick={() => handleExport('csv')} variant="outline" size="sm">
              CSV
            </Button>
            <Button onClick={() => handleExport('pdf')} variant="outline" size="sm">
              PDF
            </Button>
          </div>
          
          <Button onClick={fetchWorkflowResults} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* サマリーカード */}
      {workflow.summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総エージェント</p>
                  <p className="text-2xl font-bold">{workflow.summary.totalAgents}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">完了エージェント</p>
                  <p className="text-2xl font-bold">{workflow.summary.completedAgents}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">実行時間</p>
                  <p className="text-2xl font-bold">{formatDuration(workflow.summary.executionTime)}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">成功率</p>
                  <p className="text-2xl font-bold">{workflow.summary.successRate.toFixed(1)}%</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div 
                    className="w-4 h-4 bg-green-500 rounded-full"
                    style={{ 
                      transform: `scale(${workflow.summary.successRate / 100})` 
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* メインコンテンツ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="agents">エージェント詳細</TabsTrigger>
          <TabsTrigger value="outputs">出力データ</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* エージェント実行フロー */}
          <Card>
            <CardHeader>
              <CardTitle>エージェント実行フロー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflow.agents.map((agent, index) => {
                  const config = AGENT_CONFIG[agent.type as keyof typeof AGENT_CONFIG];
                  const Icon = config?.icon || FileText;
                  
                  return (
                    <div key={agent.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-full ${
                          agent.status === 'completed' ? 'bg-green-100' :
                          agent.status === 'failed' ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            agent.status === 'completed' ? 'text-green-600' :
                            agent.status === 'failed' ? 'text-red-600' : 'text-blue-600'
                          }`} />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">
                            {index + 1}. {config?.name || agent.type}
                          </h3>
                          <Badge className={getStatusColor(agent.status)}>
                            {agent.status === 'completed' ? '完了' :
                             agent.status === 'failed' ? '失敗' : '実行中'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {config?.description || 'エージェントの説明がありません'}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          実行時間: {formatDuration(agent.executionTime)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="agents" className="space-y-6">
          {workflow.agents.map((agent) => {
            const config = AGENT_CONFIG[agent.type as keyof typeof AGENT_CONFIG];
            const Icon = config?.icon || FileText;
            
            return (
              <Card key={agent.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Icon className="w-5 h-5 mr-2" />
                    {config?.name || agent.type}
                    <Badge className={`ml-3 ${getStatusColor(agent.status)}`}>
                      {agent.status === 'completed' ? '完了' :
                       agent.status === 'failed' ? '失敗' : '実行中'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">実行情報</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-600">開始:</span> {new Date(agent.startedAt).toLocaleString()}</p>
                        {agent.completedAt && (
                          <p><span className="text-gray-600">完了:</span> {new Date(agent.completedAt).toLocaleString()}</p>
                        )}
                        <p><span className="text-gray-600">実行時間:</span> {formatDuration(agent.executionTime)}</p>
                        {agent.error && (
                          <p className="text-red-600"><span className="text-gray-600">エラー:</span> {agent.error}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">出力プレビュー</h4>
                      <div className="max-h-48 overflow-y-auto">
                        {renderAgentOutput(agent)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
        
        <TabsContent value="outputs" className="space-y-6">
          <ContentGallery workflowId={workflowId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}