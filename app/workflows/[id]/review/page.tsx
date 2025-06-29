'use client'

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Eye, 
  ArrowLeft, 
  ArrowRight,
  Save,
  RotateCcw,
  AlertTriangle,
  Clock,
  User,
  Bot
} from 'lucide-react';

// 承認データの型定義
interface ReviewStep {
  id: string;
  stepIndex: number;
  agentType: string;
  status: string;
  input: any;
  output: any;
  metadata: any;
  executionTime: number | null;
  requiresReview: boolean;
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'modified';
  feedback: string | null;
  corrections: any;
}

interface WorkflowReview {
  workflowId: string;
  workflowName: string;
  workflowStatus: string;
  totalSteps: number;
  reviewSteps: ReviewStep[];
  nextStepIndex: number;
  hasCompletedSteps: boolean;
}

// エージェント設定
const AGENT_CONFIG = {
  market_research: {
    name: '市場調査エージェント',
    description: '市場トレンドとターゲット分析',
    icon: '📊'
  },
  content_scraping: {
    name: 'コンテンツスクレイピングエージェント',
    description: 'SNSから高エンゲージメントコンテンツを収集',
    icon: '🔍'
  },
  nlp_classification: {
    name: 'NLP分類エージェント',
    description: 'コンテンツを感情・構造別に分類',
    icon: '🧠'
  },
  template_optimization: {
    name: 'テンプレート最適化エージェント',
    description: '成功パターンをテンプレート化',
    icon: '⚙️'
  },
  business_strategy: {
    name: '商品設計エージェント',
    description: 'セールスファネルと商品戦略設計',
    icon: '💼'
  },
  content_creation: {
    name: 'コンテンツ生成エージェント',
    description: 'LP・SNS・メールコンテンツ生成',
    icon: '✨'
  },
  copy_generation: {
    name: 'コピー生成エージェント',
    description: 'フックとコピーバリエーション生成',
    icon: '✍️'
  },
  optimization_archive: {
    name: '最適化・保存エージェント',
    description: '成功パターンをアーカイブ化',
    icon: '📁'
  }
};

export default function WorkflowReviewPage() {
  const params = useParams();
  const workflowId = params.id as string;
  
  const [reviewData, setReviewData] = useState<WorkflowReview | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [corrections, setCorrections] = useState('');
  const [editingOutput, setEditingOutput] = useState(false);
  const [modifiedOutput, setModifiedOutput] = useState('');

  // データ取得
  useEffect(() => {
    if (workflowId) {
      fetchReviewData();
    }
  }, [workflowId]);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/workflows/${workflowId}/review`);
      if (!response.ok) {
        throw new Error('Failed to fetch review data');
      }
      
      const data = await response.json();
      setReviewData(data);
      
      if (data.nextStepIndex >= 0) {
        setCurrentStepIndex(data.nextStepIndex);
      } else if (data.reviewSteps.length > 0) {
        setCurrentStepIndex(0);
      }
      
    } catch (error) {
      console.error('Failed to fetch review data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ステップ承認
  const handleApprove = async () => {
    if (!reviewData || !reviewData.reviewSteps[currentStepIndex]) return;

    try {
      setSubmitting(true);
      
      const step = reviewData.reviewSteps[currentStepIndex];
      const response = await fetch(`/api/workflows/${workflowId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: step.id,
          action: 'approve',
          feedback: feedback || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve step');
      }

      // データを更新
      await fetchReviewData();
      setFeedback('');
      
      // 次のステップに移動
      if (currentStepIndex < reviewData.reviewSteps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
      
    } catch (error) {
      console.error('Failed to approve step:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // ステップ拒否
  const handleReject = async () => {
    if (!reviewData || !reviewData.reviewSteps[currentStepIndex]) return;

    try {
      setSubmitting(true);
      
      const step = reviewData.reviewSteps[currentStepIndex];
      const response = await fetch(`/api/workflows/${workflowId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: step.id,
          action: 'reject',
          feedback,
          corrections: corrections || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reject step');
      }

      await fetchReviewData();
      setFeedback('');
      setCorrections('');
      
    } catch (error) {
      console.error('Failed to reject step:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // ステップ修正
  const handleModify = async () => {
    if (!reviewData || !reviewData.reviewSteps[currentStepIndex]) return;

    try {
      setSubmitting(true);
      
      const step = reviewData.reviewSteps[currentStepIndex];
      let modifiedOutputData = null;
      
      if (editingOutput && modifiedOutput) {
        try {
          modifiedOutputData = JSON.parse(modifiedOutput);
        } catch (error) {
          alert('出力データのJSON形式が正しくありません');
          return;
        }
      }

      const response = await fetch(`/api/workflows/${workflowId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: step.id,
          action: 'modify',
          feedback,
          corrections: corrections || null,
          modifiedOutput: modifiedOutputData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to modify step');
      }

      await fetchReviewData();
      setFeedback('');
      setCorrections('');
      setEditingOutput(false);
      setModifiedOutput('');
      
    } catch (error) {
      console.error('Failed to modify step:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // 出力編集モード切り替え
  const toggleEditOutput = () => {
    if (!editingOutput && reviewData && reviewData.reviewSteps[currentStepIndex]) {
      const currentOutput = reviewData.reviewSteps[currentStepIndex].output;
      setModifiedOutput(JSON.stringify(currentOutput, null, 2));
    }
    setEditingOutput(!editingOutput);
  };

  // 承認ステータスの色
  const getReviewStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'modified': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  // 承認ステータスアイコン
  const getReviewStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      case 'modified': return Edit3;
      default: return Clock;
    }
  };

  if (loading) {
    return (
      <div className="container-responsive py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!reviewData || reviewData.reviewSteps.length === 0) {
    return (
      <div className="container-responsive py-8">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            承認待ちのステップがありません
          </h2>
          <p className="text-gray-600">
            このワークフローには承認が必要なステップがないか、まだ実行されていません。
          </p>
        </div>
      </div>
    );
  }

  const currentStep = reviewData.reviewSteps[currentStepIndex];
  const config = AGENT_CONFIG[currentStep?.agentType as keyof typeof AGENT_CONFIG];

  return (
    <div className="container-responsive py-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-responsive-xl font-bold text-gray-900">
            ワークフロー承認 - {reviewData.workflowName}
          </h1>
          <p className="text-gray-600">
            各ステップの実行結果を確認し、承認・修正・やり直しを決定
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className={
            reviewData.workflowStatus === 'completed' ? 'bg-green-100 text-green-800' :
            reviewData.workflowStatus === 'review_pending' ? 'bg-yellow-100 text-yellow-800' :
            reviewData.workflowStatus === 'needs_review' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }>
            {reviewData.workflowStatus === 'completed' ? '完了' :
             reviewData.workflowStatus === 'review_pending' ? '承認待ち' :
             reviewData.workflowStatus === 'needs_review' ? '要修正' : '実行中'}
          </Badge>
          
          <span className="text-sm text-gray-500">
            {currentStepIndex + 1} / {reviewData.reviewSteps.length}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* ステップナビゲーション */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ステップ一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reviewData.reviewSteps.map((step, index) => {
                  const stepConfig = AGENT_CONFIG[step.agentType as keyof typeof AGENT_CONFIG];
                  const StatusIcon = getReviewStatusIcon(step.reviewStatus);
                  
                  return (
                    <div
                      key={step.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        currentStepIndex === index 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setCurrentStepIndex(index)}
                    >
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{stepConfig?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {index + 1}. {stepConfig?.name}
                          </p>
                          <div className="flex items-center mt-1">
                            <StatusIcon className="w-3 h-3 mr-1" />
                            <Badge size="sm" className={getReviewStatusColor(step.reviewStatus)}>
                              {step.reviewStatus === 'approved' ? '承認' :
                               step.reviewStatus === 'rejected' ? '拒否' :
                               step.reviewStatus === 'modified' ? '修正' : '待機'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ステップ詳細 */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{config?.icon}</span>
                  <div>
                    <h2 className="text-xl">{config?.name}</h2>
                    <p className="text-sm text-gray-600 font-normal">{config?.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                    disabled={currentStepIndex === 0}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStepIndex(Math.min(reviewData.reviewSteps.length - 1, currentStepIndex + 1))}
                    disabled={currentStepIndex === reviewData.reviewSteps.length - 1}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 実行情報 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-medium text-gray-700">実行時間</p>
                  <p className="text-lg">
                    {currentStep.executionTime 
                      ? `${Math.round(currentStep.executionTime / 1000)}秒`
                      : '不明'}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-medium text-gray-700">ステータス</p>
                  <Badge className={getReviewStatusColor(currentStep.reviewStatus)}>
                    {currentStep.reviewStatus === 'approved' ? '承認済み' :
                     currentStep.reviewStatus === 'rejected' ? '拒否済み' :
                     currentStep.reviewStatus === 'modified' ? '修正済み' : '承認待ち'}
                  </Badge>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-medium text-gray-700">承認必要</p>
                  <p className="text-lg">
                    {currentStep.requiresReview ? '必要' : '不要'}
                  </p>
                </div>
              </div>

              {/* 入力データ */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Bot className="w-4 h-4 mr-2" />
                  入力データ
                </h4>
                <div className="bg-gray-50 p-4 rounded border">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(currentStep.input, null, 2)}
                  </pre>
                </div>
              </div>

              {/* 出力データ */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Bot className="w-4 h-4 mr-2" />
                    実行結果
                  </h4>
                  
                  {currentStep.reviewStatus === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleEditOutput}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      {editingOutput ? 'キャンセル' : '結果編集'}
                    </Button>
                  )}
                </div>
                
                {editingOutput ? (
                  <div className="space-y-3">
                    <Textarea
                      value={modifiedOutput}
                      onChange={(e) => setModifiedOutput(e.target.value)}
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <Button onClick={toggleEditOutput} size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      編集完了
                    </Button>
                  </div>
                ) : (
                  <div className="bg-green-50 p-4 rounded border border-green-200">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(currentStep.output, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* 前回のフィードバック */}
              {currentStep.feedback && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    前回のフィードバック
                  </h4>
                  <div className="bg-blue-50 p-4 rounded border border-blue-200">
                    <p className="text-sm">{currentStep.feedback}</p>
                  </div>
                </div>
              )}

              {/* 承認・修正エリア */}
              {currentStep.reviewStatus === 'pending' && (
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    承認・修正
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        フィードバック（任意）
                      </label>
                      <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="このステップに対するコメントやフィードバックを入力..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        修正指示（拒否・修正時）
                      </label>
                      <Textarea
                        value={corrections}
                        onChange={(e) => setCorrections(e.target.value)}
                        placeholder="具体的な修正内容や改善点を入力..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={handleApprove}
                        disabled={submitting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        承認
                      </Button>
                      
                      <Button
                        onClick={handleModify}
                        disabled={submitting}
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        修正して承認
                      </Button>
                      
                      <Button
                        onClick={handleReject}
                        disabled={submitting}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        やり直し
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}