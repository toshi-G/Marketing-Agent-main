'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Spinner } from '@/app/components/ui/spinner'
import { getWorkflowClient } from '@/app/lib/api/client'
import { WorkflowResponse, AgentResponse, WorkflowStatus } from '@/app/lib/api/types'
import { formatDate, getStatusColor, getAgentTypeName, safeJsonParse } from '@/app/lib/utils'
import { createDashboardData } from '@/app/lib/utils/visualization'
import { WorkflowDashboard } from '@/app/components/dashboard/workflow-dashboard'
import { ArrowLeft, RefreshCw, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, Play, BarChart3, List } from 'lucide-react'

function AgentCard({ agent }: { agent: AgentResponse }) {
  const [expanded, setExpanded] = useState(false)
  const output = agent.output ? safeJsonParse(agent.output, null) : null
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'running':
        return <Spinner size="sm" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }
  
  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(agent.status)}
            <div>
              <CardTitle className="text-base">
                {getAgentTypeName(agent.type)}
              </CardTitle>
              <CardDescription className="text-xs">
                {agent.completedAt 
                  ? `完了: ${formatDate(agent.completedAt)}`
                  : `開始: ${formatDate(agent.createdAt)}`
                }
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(agent.status)}>
              {agent.status === 'pending' && '待機中'}
              {agent.status === 'running' && '実行中'}
              {agent.status === 'completed' && '完了'}
              {agent.status === 'failed' && '失敗'}
            </Badge>
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </div>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="border-t">
          {agent.error && (
            <div className="bg-red-50 text-red-900 p-3 rounded-md mb-4">
              <p className="font-medium">エラー:</p>
              <p className="text-sm mt-1">{agent.error}</p>
            </div>
          )}
          
          {output && (
            <div className="space-y-3">
              <p className="font-medium text-sm">出力結果:</p>
              <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs">
                {JSON.stringify(output, null, 2)}
              </pre>
            </div>
          )}
          
          {!output && !agent.error && agent.status === 'completed' && (
            <p className="text-muted-foreground text-sm">出力データなし</p>
          )}
          
          {agent.status === 'pending' && (
            <p className="text-muted-foreground text-sm">実行待機中...</p>
          )}
          
          {agent.status === 'running' && (
            <div className="flex items-center space-x-2 text-sm">
              <Spinner size="sm" />
              <span>処理中...</span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export default function WorkflowDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [workflow, setWorkflow] = useState<WorkflowResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'dashboard' | 'agents'>('dashboard')
  
  const fetchWorkflow = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const client = getWorkflowClient()
      const data = await client.getWorkflow(params.id as string)
      setWorkflow(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [params.id])
  
  useEffect(() => {
    fetchWorkflow()
    
    // 実行中の場合は定期的に更新
    const interval = setInterval(() => {
      if (workflow?.status === 'running') {
        fetchWorkflow()
      }
    }, 10000) // 10秒ごと
    
    return () => clearInterval(interval)
  }, [fetchWorkflow, workflow?.status])
  
  if (loading && !workflow) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchWorkflow} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              再読み込み
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  if (!workflow) return null
  
  const completedAgents = workflow.agents.filter(a => a.status === 'completed').length
  const totalAgents = workflow.agents.length
  const progress = totalAgents > 0 ? (completedAgents / totalAgents) * 100 : 0

  // ダッシュボード用データの作成
  const dashboardData = createDashboardData(
    workflow.id,
    workflow.name,
    workflow.status as WorkflowStatus,
    workflow.agents,
    workflow.completedAt
  )
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{workflow.name}</h1>
                <div className="flex items-center space-x-3 mt-1">
                  <p className="text-muted-foreground text-sm">
                    作成日: {formatDate(workflow.createdAt)}
                  </p>
                  <Badge className={getStatusColor(workflow.status)}>
                    {workflow.status === 'pending' && '待機中'}
                    {workflow.status === 'running' && '実行中'}
                    {workflow.status === 'completed' && '完了'}
                    {workflow.status === 'failed' && '失敗'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* ビューモード切り替え */}
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'dashboard' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('dashboard')}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  ダッシュボード
                </Button>
                <Button
                  variant={viewMode === 'agents' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('agents')}
                  className="flex items-center gap-2"
                >
                  <List className="w-4 h-4" />
                  エージェント詳細
                </Button>
              </div>
              <Button onClick={fetchWorkflow} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                更新
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {viewMode === 'dashboard' ? (
          // ダッシュボードビュー
          <WorkflowDashboard data={dashboardData} />
        ) : (
          // 従来のエージェント詳細ビュー
          <div className="space-y-6">
            {/* 進捗表示 */}
            <Card>
              <CardHeader>
                <CardTitle>全体進捗</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">完了エージェント</span>
                    <span className="font-medium">{completedAgents}/{totalAgents}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div 
                      className="bg-primary h-3 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {workflow.completedAt && (
                    <p className="text-sm text-muted-foreground mt-2">
                      完了日時: {formatDate(workflow.completedAt)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* エージェント一覧 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">エージェント実行状況</h2>
              <div className="space-y-3">
                {workflow.agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
