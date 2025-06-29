// リアルタイムワークフロー進捗フック

import { useState, useEffect, useCallback } from 'react';
import { Workflow, Agent } from '@prisma/client';

type WorkflowWithAgents = Workflow & {
  agents: Agent[];
};

interface WorkflowProgress {
  workflow: WorkflowWithAgents | null;
  currentStep: number;
  totalSteps: number;
  isRunning: boolean;
  progress: number;
  currentAgent: Agent | null;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseWorkflowProgressOptions {
  workflowId: string;
  pollInterval?: number; // ポーリング間隔（ミリ秒）
  autoRefresh?: boolean;
}

export function useWorkflowProgress({ 
  workflowId, 
  pollInterval = 2000, 
  autoRefresh = true 
}: UseWorkflowProgressOptions): WorkflowProgress & {
  refresh: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
} {
  const [workflow, setWorkflow] = useState<WorkflowWithAgents | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // ワークフローデータを取得する関数
  const fetchWorkflow = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/workflows/${workflowId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow: ${response.statusText}`);
      }
      
      const workflowData = await response.json();
      setWorkflow(workflowData);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to fetch workflow:', err);
    }
  }, [workflowId]);

  // 進捗計算
  const calculateProgress = useCallback((workflow: WorkflowWithAgents | null) => {
    if (!workflow || !workflow.agents || workflow.agents.length === 0) {
      return {
        currentStep: 0,
        totalSteps: 8, // 8つのエージェント
        progress: 0,
        currentAgent: null,
        isRunning: false
      };
    }

    const agents = workflow.agents.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const completedAgents = agents.filter(agent => agent.status === 'completed');
    const runningAgent = agents.find(agent => agent.status === 'running');
    const failedAgent = agents.find(agent => agent.status === 'failed');

    const currentStep = completedAgents.length + (runningAgent ? 1 : 0);
    const totalSteps = agents.length;
    const progress = Math.round((completedAgents.length / totalSteps) * 100);

    const isRunning = workflow.status === 'running' || 
                     workflow.status === 'pending' || 
                     Boolean(runningAgent);

    return {
      currentStep,
      totalSteps,
      progress,
      currentAgent: runningAgent || failedAgent || null,
      isRunning
    };
  }, []);

  // ポーリング開始
  const startPolling = useCallback(() => {
    if (isPolling) return;
    
    setIsPolling(true);
    const interval = setInterval(fetchWorkflow, pollInterval);
    
    // クリーンアップ関数を返すため、useEffectで管理
    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [fetchWorkflow, pollInterval, isPolling]);

  // ポーリング停止
  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  // 初回データ取得とポーリング開始
  useEffect(() => {
    fetchWorkflow();
    
    let cleanup: (() => void) | undefined;
    
    if (autoRefresh && workflowId) {
      cleanup = startPolling();
    }
    
    return cleanup;
  }, [workflowId, autoRefresh, fetchWorkflow, startPolling]);

  // ワークフローが完了したらポーリング停止
  useEffect(() => {
    if (workflow && (workflow.status === 'completed' || workflow.status === 'failed')) {
      stopPolling();
    }
  }, [workflow, stopPolling]);

  const progress = calculateProgress(workflow);

  return {
    workflow,
    error,
    lastUpdated,
    refresh: fetchWorkflow,
    startPolling,
    stopPolling,
    ...progress
  };
}