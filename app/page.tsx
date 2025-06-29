'use client'

import { useState } from 'react'
import { CreateWorkflowModal } from '@/components/create-workflow-modal'
import { WorkflowList } from '@/components/workflow-list'
import WorkflowReviewWidget from '@/components/workflow-review-widget'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Plus, Zap, TrendingUp, Target, Brain, FileText, Megaphone, Archive } from 'lucide-react'

export default function HomePage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  
  const handleWorkflowCreated = () => {
    setRefreshKey(prev => prev + 1)
  }
  
  const agents = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      name: '市場調査',
      description: 'トレンドと収益性の高いジャンルを特定'
    },
    {
      icon: <Target className="w-5 h-5" />,
      name: 'トレンド分析',
      description: 'SNSから高反応フレーズを抽出'
    },
    {
      icon: <Brain className="w-5 h-5" />,
      name: 'NLP分類',
      description: '訴求タイプ・感情別に分類'
    },
    {
      icon: <FileText className="w-5 h-5" />,
      name: 'テンプレート最適化',
      description: '高成功率の構成パターンを選出'
    },
    {
      icon: <Zap className="w-5 h-5" />,
      name: '商品設計',
      description: '最適な商品構成とファネル設計'
    },
    {
      icon: <FileText className="w-5 h-5" />,
      name: 'コンテンツ生成',
      description: 'LP・SNS・メールを自動生成'
    },
    {
      icon: <Megaphone className="w-5 h-5" />,
      name: 'コピー生成',
      description: '煽り・共感・逆張りフックを量産'
    },
    {
      icon: <Archive className="w-5 h-5" />,
      name: '最適化・保存',
      description: '成功パターンをテンプレート化'
    }
  ]
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Marketing Agent</h1>
              <p className="text-muted-foreground mt-1">
                AI駆動マーケティング自動化システム
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新規ワークフロー
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* エージェント紹介 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8つの専門AIエージェント</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {agents.map((agent, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {agent.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">{agent.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{agent.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
          
          {/* 承認待ち & ワークフロー一覧 */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <section>
                <h2 className="text-2xl font-semibold mb-4">ワークフロー一覧</h2>
                <WorkflowList key={refreshKey} />
              </section>
            </div>
            
            <div className="lg:col-span-1">
              <section>
                <h2 className="text-2xl font-semibold mb-4">承認待ち</h2>
                <WorkflowReviewWidget 
                  onNavigateToReview={(workflowId) => {
                    window.location.href = `/workflows/${workflowId}/review`;
                  }}
                />
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <CreateWorkflowModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleWorkflowCreated}
      />
    </div>
  )
}
