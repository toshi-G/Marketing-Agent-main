'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowRight,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface ReviewSummary {
  workflowId: string;
  workflowName: string;
  totalSteps: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  nextReviewStep?: {
    id: string;
    agentType: string;
    title: string;
  };
}

interface WorkflowReviewWidgetProps {
  workflowId?: string;
  onNavigateToReview?: (workflowId: string) => void;
  className?: string;
}

export default function WorkflowReviewWidget({ 
  workflowId, 
  onNavigateToReview,
  className = '' 
}: WorkflowReviewWidgetProps) {
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workflowId) {
      fetchReviewSummary();
    } else {
      fetchAllPendingReviews();
    }
  }, [workflowId]);

  const fetchReviewSummary = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/workflows/${workflowId}/review`);
      if (!response.ok) {
        throw new Error('Failed to fetch review summary');
      }
      
      const data = await response.json();
      
      // レビューサマリーを計算
      const summary: ReviewSummary = {
        workflowId: data.workflowId,
        workflowName: data.workflowName,
        totalSteps: data.totalSteps,
        pendingReview: data.reviewSteps.filter((step: any) => step.reviewStatus === 'pending').length,
        approved: data.reviewSteps.filter((step: any) => step.reviewStatus === 'approved' || step.reviewStatus === 'modified').length,
        rejected: data.reviewSteps.filter((step: any) => step.reviewStatus === 'rejected').length
      };
      
      // 次の承認待ちステップ
      const nextStep = data.reviewSteps.find((step: any) => step.reviewStatus === 'pending');
      if (nextStep) {
        summary.nextReviewStep = {
          id: nextStep.id,
          agentType: nextStep.agentType,
          title: getAgentTitle(nextStep.agentType)
        };
      }
      
      setReviewSummary(summary);
      
    } catch (error) {
      console.error('Failed to fetch review summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPendingReviews = async () => {
    try {
      setLoading(true);
      
      // 承認待ちワークフローの一覧を取得する API を呼び出し
      const response = await fetch('/api/workflows?status=review_pending&limit=1');
      if (!response.ok) {
        throw new Error('Failed to fetch pending reviews');
      }
      
      const data = await response.json();
      
      if (data.workflows && data.workflows.length > 0) {
        const workflow = data.workflows[0];
        const summary: ReviewSummary = {
          workflowId: workflow.id,
          workflowName: workflow.name,
          totalSteps: workflow.agents?.length || 0,
          pendingReview: 1, // 簡略化
          approved: 0,
          rejected: 0
        };
        
        setReviewSummary(summary);
      }
      
    } catch (error) {
      console.error('Failed to fetch pending reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAgentTitle = (agentType: string): string => {
    const titles: Record<string, string> = {
      market_research: '市場調査エージェント',
      content_scraping: 'コンテンツスクレイピングエージェント',
      nlp_classification: 'NLP分類エージェント',
      template_optimization: 'テンプレート最適化エージェント',
      business_strategy: '商品設計エージェント',
      content_creation: 'コンテンツ生成エージェント',
      copy_generation: 'コピー生成エージェント',
      optimization_archive: '最適化・保存エージェント'
    };
    
    return titles[agentType] || agentType;
  };

  const handleNavigateToReview = () => {
    if (reviewSummary && onNavigateToReview) {
      onNavigateToReview(reviewSummary.workflowId);
    } else if (reviewSummary) {
      window.location.href = `/workflows/${reviewSummary.workflowId}/review`;
    }
  };

  const getProgressPercentage = () => {
    if (!reviewSummary || reviewSummary.totalSteps === 0) return 0;
    return Math.round((reviewSummary.approved / reviewSummary.totalSteps) * 100);
  };

  const getStatusColor = () => {
    if (!reviewSummary) return 'bg-gray-100 text-gray-800';
    
    if (reviewSummary.rejected > 0) {
      return 'bg-red-100 text-red-800';
    } else if (reviewSummary.pendingReview > 0) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-green-100 text-green-800';
    }
  };

  const getStatusText = () => {
    if (!reviewSummary) return '読み込み中';
    
    if (reviewSummary.rejected > 0) {
      return '要修正あり';
    } else if (reviewSummary.pendingReview > 0) {
      return '承認待ち';
    } else {
      return '承認完了';
    }
  };

  const getStatusIcon = () => {
    if (!reviewSummary) return Clock;
    
    if (reviewSummary.rejected > 0) {
      return AlertTriangle;
    } else if (reviewSummary.pendingReview > 0) {
      return Eye;
    } else {
      return CheckCircle;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!reviewSummary) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600">承認待ちのワークフローはありません</p>
        </CardContent>
      </Card>
    );
  }

  const StatusIcon = getStatusIcon();

  return (
    <Card className={`${className} border-l-4 ${
      reviewSummary.rejected > 0 ? 'border-l-red-500' :
      reviewSummary.pendingReview > 0 ? 'border-l-yellow-500' :
      'border-l-green-500'
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center">
            <StatusIcon className="w-5 h-5 mr-2" />
            <span>ワークフロー承認</span>
          </div>
          <Badge className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ワークフロー情報 */}
        <div>
          <h4 className="font-medium text-gray-900 truncate mb-1">
            {reviewSummary.workflowName}
          </h4>
          <p className="text-sm text-gray-600">
            {reviewSummary.totalSteps}ステップ中 {reviewSummary.approved}ステップ承認済み
          </p>
        </div>

        {/* 進捗バー */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">承認進捗</span>
            <span className="font-medium">{getProgressPercentage()}%</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>

        {/* 統計 */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-green-50 p-2 rounded">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm font-medium text-green-700">{reviewSummary.approved}</p>
            <p className="text-xs text-green-600">承認済み</p>
          </div>
          
          <div className="bg-yellow-50 p-2 rounded">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <p className="text-sm font-medium text-yellow-700">{reviewSummary.pendingReview}</p>
            <p className="text-xs text-yellow-600">承認待ち</p>
          </div>
          
          <div className="bg-red-50 p-2 rounded">
            <div className="flex items-center justify-center mb-1">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-sm font-medium text-red-700">{reviewSummary.rejected}</p>
            <p className="text-xs text-red-600">要修正</p>
          </div>
        </div>

        {/* 次のアクション */}
        {reviewSummary.nextReviewStep && (
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-1">
              次の承認待ち:
            </p>
            <p className="text-sm text-blue-700">
              {reviewSummary.nextReviewStep.title}
            </p>
          </div>
        )}

        {/* アクションボタン */}
        {reviewSummary.pendingReview > 0 && (
          <Button 
            onClick={handleNavigateToReview}
            className="w-full"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            承認画面を開く
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {reviewSummary.rejected > 0 && (
          <Button 
            onClick={handleNavigateToReview}
            variant="outline"
            className="w-full border-red-300 text-red-700 hover:bg-red-50"
            size="sm"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            修正を確認
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {reviewSummary.pendingReview === 0 && reviewSummary.rejected === 0 && (
          <div className="text-center py-2">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-sm text-green-700 font-medium">すべて承認済み</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}