'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { getWorkflowClient } from '@/lib/api/client'
import { WorkflowResponse } from '@/lib/api/types'
import { formatDate, getStatusColor, getAgentTypeName } from '@/lib/utils'
import { ChevronRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export function WorkflowList() {
  const [workflows, setWorkflows] = useState<WorkflowResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      setError('')
      const client = getWorkflowClient()
      const data = await client.listWorkflows()
      setWorkflows(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchWorkflows()
  }, [])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchWorkflows} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          再読み込み
        </Button>
      </div>
    )
  }
  
  if (workflows.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>まだワークフローがありません</p>
        <p className="text-sm mt-2">「新規作成」ボタンから最初のワークフローを作成してください</p>
      </div>
    )
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {workflows.map((workflow) => {
        const completedAgents = workflow.agents.filter(a => a.status === 'completed').length
        const totalAgents = workflow.agents.length
        const progress = totalAgents > 0 ? (completedAgents / totalAgents) * 100 : 0
        
        return (
          <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  <CardDescription>
                    {formatDate(workflow.createdAt)}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(workflow.status)}>
                  {workflow.status === 'pending' && '待機中'}
                  {workflow.status === 'running' && '実行中'}
                  {workflow.status === 'completed' && '完了'}
                  {workflow.status === 'failed' && '失敗'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">進捗</span>
                    <span className="font-medium">{completedAgents}/{totalAgents}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                
                {workflow.status === 'running' && (
                  <div className="text-sm text-muted-foreground">
                    現在実行中: {getAgentTypeName(
                      workflow.agents.find(a => a.status === 'running')?.type || ''
                    )}
                  </div>
                )}
                
                <Link href={`/workflows/${workflow.id}`}>
                  <Button className="w-full" variant="outline">
                    詳細を見る
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
