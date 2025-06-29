// Workflow Review and Approval API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/utils/db';
import { getErrorMessage } from '@/lib/utils';

// GET /api/workflows/[id]/review - 承認待ちステップ取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;

    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        agents: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            type: true,
            status: true,
            input: true,
            output: true,
            error: true,
            createdAt: true,
            completedAt: true,
            metadata: true
          }
        }
      }
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // 承認待ちのステップを特定
    const reviewSteps = workflow.agents
      .filter(agent => agent.status === 'completed' && agent.output)
      .map((agent, index) => {
        let output = null;
        let metadata = null;
        
        try {
          output = agent.output ? JSON.parse(agent.output) : null;
          metadata = agent.metadata ? JSON.parse(agent.metadata) : null;
        } catch (error) {
          output = { raw: agent.output };
          metadata = {};
        }

        return {
          id: agent.id,
          stepIndex: index,
          agentType: agent.type,
          status: agent.status,
          input: agent.input ? JSON.parse(agent.input) : {},
          output,
          metadata,
          executionTime: agent.completedAt 
            ? new Date(agent.completedAt).getTime() - new Date(agent.createdAt).getTime()
            : null,
          requiresReview: metadata?.requiresReview || true,
          reviewStatus: metadata?.reviewStatus || 'pending',
          feedback: metadata?.feedback || null,
          corrections: metadata?.corrections || null
        };
      });

    return NextResponse.json({
      workflowId: workflow.id,
      workflowName: workflow.name,
      workflowStatus: workflow.status,
      totalSteps: workflow.agents.length,
      reviewSteps,
      nextStepIndex: reviewSteps.findIndex(step => step.reviewStatus === 'pending'),
      hasCompletedSteps: reviewSteps.length > 0
    });

  } catch (error) {
    console.error('Workflow review fetch error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// POST /api/workflows/[id]/review - ステップ承認・修正
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;
    const body = await request.json();
    const { 
      stepId, 
      action, // 'approve' | 'reject' | 'modify'
      feedback,
      corrections,
      modifiedInput,
      modifiedOutput
    } = body;

    if (!stepId || !action) {
      return NextResponse.json(
        { error: 'stepId and action are required' },
        { status: 400 }
      );
    }

    // エージェント（ステップ）を取得
    const agent = await prisma.agent.findFirst({
      where: {
        id: stepId,
        workflowId: workflowId
      }
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Step not found' },
        { status: 404 }
      );
    }

    let updatedMetadata = {};
    let newStatus = agent.status;
    let newInput = agent.input;
    let newOutput = agent.output;

    try {
      updatedMetadata = agent.metadata ? JSON.parse(agent.metadata) : {};
    } catch (error) {
      updatedMetadata = {};
    }

    switch (action) {
      case 'approve':
        updatedMetadata = {
          ...updatedMetadata,
          reviewStatus: 'approved',
          feedback,
          approvedAt: new Date().toISOString()
        };
        break;

      case 'reject':
        updatedMetadata = {
          ...updatedMetadata,
          reviewStatus: 'rejected',
          feedback,
          rejectedAt: new Date().toISOString(),
          corrections
        };
        newStatus = 'pending'; // ステップを再実行待ちに戻す
        break;

      case 'modify':
        updatedMetadata = {
          ...updatedMetadata,
          reviewStatus: 'modified',
          feedback,
          corrections,
          modifiedAt: new Date().toISOString(),
          originalInput: agent.input,
          originalOutput: agent.output
        };
        
        if (modifiedInput) {
          newInput = JSON.stringify(modifiedInput);
        }
        
        if (modifiedOutput) {
          newOutput = JSON.stringify(modifiedOutput);
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: approve, reject, or modify' },
          { status: 400 }
        );
    }

    // エージェントを更新
    const updatedAgent = await prisma.agent.update({
      where: { id: stepId },
      data: {
        status: newStatus,
        input: newInput,
        output: newOutput,
        metadata: JSON.stringify(updatedMetadata)
      }
    });

    // 次のステップの処理
    if (action === 'approve' || action === 'modify') {
      await processNextStep(workflowId, stepId);
    }

    // ワークフロー全体のステータスを更新
    await updateWorkflowReviewStatus(workflowId);

    return NextResponse.json({
      stepId,
      action,
      newStatus,
      metadata: updatedMetadata,
      message: `Step ${action}d successfully`
    });

  } catch (error) {
    console.error('Workflow review action error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// 次のステップを処理
async function processNextStep(workflowId: string, currentStepId: string) {
  try {
    // 現在のステップのインデックスを取得
    const agents = await prisma.agent.findMany({
      where: { workflowId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, status: true }
    });

    const currentIndex = agents.findIndex(agent => agent.id === currentStepId);
    const nextIndex = currentIndex + 1;

    if (nextIndex < agents.length) {
      const nextAgent = agents[nextIndex];
      
      // 次のステップが待機中の場合、自動実行準備
      if (nextAgent.status === 'pending') {
        await prisma.agent.update({
          where: { id: nextAgent.id },
          data: {
            metadata: JSON.stringify({
              readyForExecution: true,
              previousStepApproved: true,
              queuedAt: new Date().toISOString()
            })
          }
        });
      }
    }
  } catch (error) {
    console.error('Next step processing error:', error);
  }
}

// ワークフローの承認ステータス更新
async function updateWorkflowReviewStatus(workflowId: string) {
  try {
    const agents = await prisma.agent.findMany({
      where: { workflowId },
      select: { status: true, metadata: true }
    });

    const completedAgents = agents.filter(agent => agent.status === 'completed');
    const pendingReviewCount = completedAgents.filter(agent => {
      try {
        const metadata = agent.metadata ? JSON.parse(agent.metadata) : {};
        return metadata.reviewStatus === 'pending' || !metadata.reviewStatus;
      } catch {
        return true;
      }
    }).length;

    const approvedCount = completedAgents.filter(agent => {
      try {
        const metadata = agent.metadata ? JSON.parse(agent.metadata) : {};
        return metadata.reviewStatus === 'approved' || metadata.reviewStatus === 'modified';
      } catch {
        return false;
      }
    }).length;

    const rejectedCount = completedAgents.filter(agent => {
      try {
        const metadata = agent.metadata ? JSON.parse(agent.metadata) : {};
        return metadata.reviewStatus === 'rejected';
      } catch {
        return false;
      }
    }).length;

    let workflowStatus = 'running';
    
    if (approvedCount === agents.length) {
      workflowStatus = 'completed';
    } else if (rejectedCount > 0) {
      workflowStatus = 'needs_review';
    } else if (pendingReviewCount > 0) {
      workflowStatus = 'review_pending';
    }

    await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        status: workflowStatus,
        metadata: JSON.stringify({
          reviewSummary: {
            total: agents.length,
            completed: completedAgents.length,
            pending: pendingReviewCount,
            approved: approvedCount,
            rejected: rejectedCount
          },
          lastReviewUpdate: new Date().toISOString()
        })
      }
    });

  } catch (error) {
    console.error('Workflow review status update error:', error);
  }
}