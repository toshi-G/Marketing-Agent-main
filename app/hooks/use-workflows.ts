// ワークフロー関連のカスタムフック

import { useState, useEffect, useCallback } from 'react';
import { getWorkflowClient } from '@/lib/api/client';
import { WorkflowResponse } from '@/lib/api/types';
import { getErrorMessage } from '@/lib/utils';

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<WorkflowResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const client = getWorkflowClient();
      const data = await client.listWorkflows();
      setWorkflows(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);
  
  return { workflows, loading, error, refetch: fetchWorkflows };
}

export function useWorkflow(id: string) {
  const [workflow, setWorkflow] = useState<WorkflowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const fetchWorkflow = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError('');
      const client = getWorkflowClient();
      const data = await client.getWorkflow(id);
      setWorkflow(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  useEffect(() => {
    fetchWorkflow();
    
    // 実行中の場合は定期的に更新
    const interval = setInterval(() => {
      if (workflow?.status === 'running') {
        fetchWorkflow();
      }
    }, 10000); // 10秒ごと
    
    return () => clearInterval(interval);
  }, [fetchWorkflow, workflow?.status]);
  
  return { workflow, loading, error, refetch: fetchWorkflow };
}

export function useCreateWorkflow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const createWorkflow = async (data: any) => {
    try {
      setLoading(true);
      setError('');
      const client = getWorkflowClient();
      const workflow = await client.startWorkflow(data);
      return workflow;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };
  
  return { createWorkflow, loading, error };
}

export function useDeleteWorkflow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const deleteWorkflow = async (id: string) => {
    try {
      setLoading(true);
      setError('');
      const client = getWorkflowClient();
      await client.deleteWorkflow(id);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return { deleteWorkflow, loading, error };
}
