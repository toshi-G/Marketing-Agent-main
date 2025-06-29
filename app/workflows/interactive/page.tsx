'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Play, 
  Pause, 
  StepForward, 
  RotateCcw, 
  Check, 
  X, 
  Edit, 
  Eye,
  ChevronRight,
  ChevronDown,
  Settings,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

// インタラクティブワークフローの型定義
interface InteractiveWorkflow {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
  currentStep: number;
  totalSteps: number;
  steps: InteractiveStep[];
  createdAt: string;
  updatedAt: string;
}

interface InteractiveStep {
  id: string;
  agentType: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'review';
  input: any;
  output: any;
  reviewRequired: boolean;
  userApproval?: boolean;
  feedback?: string;
  executionTime?: number;
  retryCount: number;
  maxRetries: number;
}

// エージェント設定
const AGENT_CONFIG = {
  market_research: {
    name: '市場調査エージェント',
    description: '市場トレンドとターゲット分析',
    icon: '📊',
    defaultInput: { target: 'ビジネス', budget: '100万円' }
  },
  content_scraping: {
    name: 'コンテンツスクレイピングエージェント',
    description: 'SNSから高エンゲージメントコンテンツを収集',
    icon: '🔍',
    defaultInput: { platform: 'Instagram', keywords: 'マーケティング' }
  },
  nlp_classification: {
    name: 'NLP分類エージェント',
    description: 'コンテンツを感情・構造別に分類',
    icon: '🧠',
    defaultInput: { analysisType: 'sentiment' }
  },
  template_optimization: {
    name: 'テンプレート最適化エージェント',
    description: '成功パターンをテンプレート化',
    icon: '⚙️',
    defaultInput: { optimizationGoal: 'conversion' }
  },
  business_strategy: {
    name: '商品設計エージェント',
    description: 'セールスファネルと商品戦略設計',
    icon: '💼',
    defaultInput: { productType: 'digital', priceRange: '1万円〜10万円' }
  },
  content_creation: {
    name: 'コンテンツ生成エージェント',
    description: 'LP・SNS・メールコンテンツ生成',
    icon: '✨',
    defaultInput: { contentType: 'landing_page', tone: 'professional' }
  },
  copy_generation: {
    name: 'コピー生成エージェント',
    description: 'フックとコピーバリエーション生成',
    icon: '✍️',
    defaultInput: { hookType: 'curiosity', quantity: 10 }
  },
  optimization_archive: {
    name: '最適化・保存エージェント',
    description: '成功パターンをアーカイブ化',
    icon: '📁',
    defaultInput: { archiveType: 'template' }
  }
};

export default function InteractiveWorkflowPage() {
  const [workflow, setWorkflow] = useState<InteractiveWorkflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [editingInput, setEditingInput] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, any>>({});

  // ワークフロー作成
  const createWorkflow = async () => {
    try {
      setLoading(true);
      
      const steps: InteractiveStep[] = Object.entries(AGENT_CONFIG).map(([agentType, config], index) => ({
        id: `step-${index + 1}`,
        agentType,
        title: config.name,
        description: config.description,
        status: 'pending',
        input: config.defaultInput,
        output: null,
        reviewRequired: true,
        retryCount: 0,
        maxRetries: 3
      }));

      const newWorkflow: InteractiveWorkflow = {
        id: `workflow-${Date.now()}`,
        name: `インタラクティブワークフロー ${new Date().toLocaleString()}`,
        status: 'draft',
        currentStep: 0,
        totalSteps: steps.length,
        steps,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setWorkflow(newWorkflow);
      setSelectedStep(0);
    } catch (error) {
      console.error('Failed to create workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  // ステップ実行
  const executeStep = async (stepIndex: number) => {
    if (!workflow) return;

    try {
      setLoading(true);
      
      const updatedSteps = [...workflow.steps];
      const step = updatedSteps[stepIndex];
      
      // ステップを実行中に設定
      step.status = 'running';
      const startTime = Date.now();
      
      setWorkflow({
        ...workflow,
        steps: updatedSteps,
        status: 'running',
        currentStep: stepIndex
      });

      // API呼び出し（模擬）
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      
      // 結果を設定
      const executionTime = Date.now() - startTime;
      const success = Math.random() > 0.1; // 90% 成功率
      
      if (success) {
        step.status = 'review';
        step.output = generateMockOutput(step.agentType);
        step.executionTime = executionTime;
      } else {
        step.status = 'failed';
        step.retryCount++;
      }
      
      setWorkflow({
        ...workflow,
        steps: updatedSteps,
        updatedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Failed to execute step:', error);
    } finally {
      setLoading(false);
    }
  };

  // ステップ承認
  const approveStep = async (stepIndex: number, approved: boolean, feedback?: string) => {
    if (!workflow) return;

    const updatedSteps = [...workflow.steps];
    const step = updatedSteps[stepIndex];
    
    step.userApproval = approved;
    step.feedback = feedback;
    step.status = approved ? 'completed' : 'pending';
    
    if (approved && stepIndex < workflow.totalSteps - 1) {
      // 次のステップを自動実行するかユーザーに確認
      setSelectedStep(stepIndex + 1);
    } else if (approved && stepIndex === workflow.totalSteps - 1) {
      // 全ステップ完了
      setWorkflow({
        ...workflow,
        steps: updatedSteps,
        status: 'completed',
        updatedAt: new Date().toISOString()
      });
    }
    
    setWorkflow({
      ...workflow,
      steps: updatedSteps,
      updatedAt: new Date().toISOString()
    });
  };

  // 入力値更新
  const updateStepInput = (stepIndex: number, input: any) => {
    if (!workflow) return;

    const updatedSteps = [...workflow.steps];
    updatedSteps[stepIndex].input = input;
    
    setWorkflow({
      ...workflow,
      steps: updatedSteps,
      updatedAt: new Date().toISOString()
    });
  };

  // ステップリトライ
  const retryStep = async (stepIndex: number) => {
    if (!workflow) return;

    const updatedSteps = [...workflow.steps];
    const step = updatedSteps[stepIndex];
    
    if (step.retryCount >= step.maxRetries) {
      alert('最大リトライ回数に達しました');
      return;
    }
    
    step.status = 'pending';
    step.output = null;
    step.userApproval = undefined;
    step.feedback = undefined;
    
    setWorkflow({
      ...workflow,
      steps: updatedSteps
    });
    
    await executeStep(stepIndex);
  };

  // モック出力生成
  const generateMockOutput = (agentType: string) => {
    const outputs = {
      market_research: {
        trends: ['AI技術の普及', 'リモートワークの定着', 'サブスクリプション化'],
        target_analysis: {
          primary: '30-40代ビジネスパーソン',
          secondary: '20代起業家',
          pain_points: ['効率化', '時間不足', 'スキル不足']
        },
        market_size: '約500億円',
        competition_level: '中程度'
      },
      content_scraping: {
        collected_posts: 127,
        high_engagement: [
          { text: '知らないと損する○○の裏技', engagement: 15200 },
          { text: '【保存版】○○の完全攻略法', engagement: 12800 },
          { text: '99%の人が間違っている○○の方法', engagement: 11500 }
        ],
        trending_hashtags: ['#効率化', '#ライフハック', '#生産性向上']
      },
      content_creation: {
        landing_page: {
          headline: '【限定公開】30日で○○を劇的に改善する秘密',
          subheadline: '業界トップ1%だけが知る究極のメソッド',
          cta: '今すぐ無料で確認する'
        },
        social_posts: [
          { platform: 'Instagram', text: '【必見】○○で人生が変わった話...' },
          { platform: 'Twitter', text: '○○について質問です。皆さんはどう思いますか？' }
        ]
      }
    };
    
    return outputs[agentType as keyof typeof outputs] || { result: 'テスト出力データ' };
  };

  // ステップ状態の色
  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'review': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // ステップアイコン
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'running': return RefreshCw;
      case 'failed': return AlertCircle;
      case 'review': return Eye;
      default: return Clock;
    }
  };

  return (
    <div className="container-responsive py-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-responsive-xl font-bold text-gray-900">インタラクティブワークフロー</h1>
          <p className="text-gray-600">
            ステップバイステップでAIエージェントを実行し、各段階で確認・調整
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {!workflow && (
            <Button onClick={createWorkflow} disabled={loading}>
              <Play className="w-4 h-4 mr-2" />
              新規ワークフロー開始
            </Button>
          )}
          
          {workflow && (
            <>
              <Button variant="outline" onClick={() => setWorkflow(null)}>
                <RotateCcw className="w-4 h-4 mr-2" />
                リセット
              </Button>
              
              {workflow.status === 'completed' && (
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  結果ダウンロード
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {!workflow ? (
        // 初期状態
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Zap className="w-16 h-16 text-blue-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              インタラクティブワークフローを開始
            </h2>
            <p className="text-gray-600 mb-6">
              各エージェントの実行を段階的に確認しながら、最適なマーケティングコンテンツを生成します。
            </p>
            <Button onClick={createWorkflow} size="lg" disabled={loading}>
              <Play className="w-5 h-5 mr-2" />
              {loading ? '作成中...' : 'ワークフロー開始'}
            </Button>
          </div>
        </div>
      ) : (
        // ワークフロー実行中
        <div className="grid gap-6 lg:grid-cols-3">
          {/* ステップ一覧 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>ワークフロー進捗</span>
                  <Badge className={
                    workflow.status === 'completed' ? 'bg-green-100 text-green-800' :
                    workflow.status === 'running' ? 'bg-blue-100 text-blue-800' :
                    workflow.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {workflow.status === 'completed' ? '完了' :
                     workflow.status === 'running' ? '実行中' :
                     workflow.status === 'failed' ? '失敗' : '準備中'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workflow.steps.map((step, index) => {
                    const Icon = getStepIcon(step.status);
                    const config = AGENT_CONFIG[step.agentType as keyof typeof AGENT_CONFIG];
                    
                    return (
                      <div
                        key={step.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedStep === index 
                            ? 'border-blue-300 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedStep(index)}
                      >
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full mr-3">
                            <span className="text-lg">{config?.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {index + 1}. {step.title}
                            </h4>
                            <div className="flex items-center mt-1">
                              <Icon className="w-4 h-4 mr-1" />
                              <Badge size="sm" className={getStepStatusColor(step.status)}>
                                {step.status === 'completed' ? '完了' :
                                 step.status === 'running' ? '実行中' :
                                 step.status === 'failed' ? '失敗' :
                                 step.status === 'review' ? '確認待ち' : '待機中'}
                              </Badge>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ステップ詳細 */}
          <div className="lg:col-span-2">
            {selectedStep !== null && workflow.steps[selectedStep] && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{workflow.steps[selectedStep].title}</span>
                    <div className="flex items-center gap-2">
                      <Badge className={getStepStatusColor(workflow.steps[selectedStep].status)}>
                        {workflow.steps[selectedStep].status === 'completed' ? '完了' :
                         workflow.steps[selectedStep].status === 'running' ? '実行中' :
                         workflow.steps[selectedStep].status === 'failed' ? '失敗' :
                         workflow.steps[selectedStep].status === 'review' ? '確認待ち' : '待機中'}
                      </Badge>
                      
                      {workflow.steps[selectedStep].status === 'pending' && (
                        <Button
                          onClick={() => executeStep(selectedStep)}
                          disabled={loading}
                          size="sm"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          実行
                        </Button>
                      )}
                      
                      {workflow.steps[selectedStep].status === 'failed' && (
                        <Button
                          onClick={() => retryStep(selectedStep)}
                          disabled={loading || workflow.steps[selectedStep].retryCount >= workflow.steps[selectedStep].maxRetries}
                          size="sm"
                          variant="outline"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          リトライ ({workflow.steps[selectedStep].retryCount}/{workflow.steps[selectedStep].maxRetries})
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 説明 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">説明</h4>
                    <p className="text-gray-600">{workflow.steps[selectedStep].description}</p>
                  </div>

                  {/* 入力設定 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">入力設定</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingInput(editingInput === workflow.steps[selectedStep].id ? null : workflow.steps[selectedStep].id)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {editingInput === workflow.steps[selectedStep].id ? 'キャンセル' : '編集'}
                      </Button>
                    </div>
                    
                    {editingInput === workflow.steps[selectedStep].id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={JSON.stringify(workflow.steps[selectedStep].input, null, 2)}
                          onChange={(e) => {
                            try {
                              const newInput = JSON.parse(e.target.value);
                              updateStepInput(selectedStep, newInput);
                            } catch (error) {
                              // JSON解析エラーは無視
                            }
                          }}
                          rows={6}
                          className="font-mono text-sm"
                        />
                        <Button
                          onClick={() => setEditingInput(null)}
                          size="sm"
                        >
                          保存
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-3 rounded border">
                        <pre className="text-sm whitespace-pre-wrap">
                          {JSON.stringify(workflow.steps[selectedStep].input, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* 出力結果 */}
                  {workflow.steps[selectedStep].output && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">実行結果</h4>
                      <div className="bg-green-50 p-4 rounded border border-green-200">
                        <pre className="text-sm whitespace-pre-wrap">
                          {JSON.stringify(workflow.steps[selectedStep].output, null, 2)}
                        </pre>
                      </div>
                      
                      {workflow.steps[selectedStep].executionTime && (
                        <p className="text-sm text-gray-500 mt-2">
                          実行時間: {Math.round(workflow.steps[selectedStep].executionTime! / 1000)}秒
                        </p>
                      )}
                    </div>
                  )}

                  {/* 確認・承認 */}
                  {workflow.steps[selectedStep].status === 'review' && (
                    <div className="border-t pt-6">
                      <h4 className="font-medium text-gray-900 mb-3">結果の確認</h4>
                      <p className="text-gray-600 mb-4">
                        このステップの実行結果を確認し、次のステップに進むかを決定してください。
                      </p>
                      
                      <div className="space-y-3">
                        <Textarea
                          placeholder="フィードバックがあれば入力してください（任意）"
                          rows={3}
                        />
                        
                        <div className="flex gap-3">
                          <Button
                            onClick={() => approveStep(selectedStep, true)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            承認して次へ
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => approveStep(selectedStep, false)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            やり直し
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}