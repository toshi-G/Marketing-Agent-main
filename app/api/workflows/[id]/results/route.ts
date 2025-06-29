// Workflow Results API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/utils/db';
import { getErrorMessage } from '@/lib/utils';

// GET /api/workflows/[id]/results - ワークフロー結果詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;

    // ワークフローとエージェント結果を取得
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        agents: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            type: true,
            status: true,
            createdAt: true,
            completedAt: true,
            output: true,
            error: true,
          }
        },
        results: {
          select: {
            id: true,
            agentResults: true,
            processedOutput: true,
            analysisData: true,
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

    // エージェント実行時間の計算
    const agentsWithExecutionTime = workflow.agents.map(agent => {
      const startTime = new Date(agent.createdAt).getTime();
      const endTime = agent.completedAt ? new Date(agent.completedAt).getTime() : Date.now();
      const executionTime = Math.round((endTime - startTime) / 1000); // 秒

      return {
        ...agent,
        startedAt: agent.createdAt,
        executionTime,
        output: agent.output ? (() => {
          try {
            return JSON.parse(agent.output);
          } catch {
            return agent.output;
          }
        })() : null
      };
    });

    // サマリー情報の計算
    const totalAgents = workflow.agents.length;
    const completedAgents = workflow.agents.filter(a => a.status === 'completed').length;
    const failedAgents = workflow.agents.filter(a => a.status === 'failed').length;
    
    // 全体実行時間の計算
    const workflowStartTime = new Date(workflow.createdAt).getTime();
    const workflowEndTime = workflow.completedAt 
      ? new Date(workflow.completedAt).getTime() 
      : Date.now();
    const totalExecutionTime = Math.round((workflowEndTime - workflowStartTime) / 1000);

    // 成功率の計算
    const successRate = totalAgents > 0 ? (completedAgents / totalAgents) * 100 : 0;

    const summary = {
      totalAgents,
      completedAgents,
      failedAgents,
      executionTime: totalExecutionTime,
      successRate,
      averageAgentTime: agentsWithExecutionTime.length > 0 
        ? Math.round(agentsWithExecutionTime.reduce((sum, a) => sum + a.executionTime, 0) / agentsWithExecutionTime.length)
        : 0
    };

    // レスポンス構造化
    const workflowResults = {
      id: workflow.id,
      name: workflow.name,
      status: workflow.status,
      createdAt: workflow.createdAt,
      completedAt: workflow.completedAt,
      agents: agentsWithExecutionTime,
      summary,
      metadata: {
        agentCount: totalAgents,
        processingTime: totalExecutionTime,
        dataGenerated: workflow.results?.length || 0,
        lastUpdated: new Date().toISOString()
      }
    };

    return NextResponse.json(workflowResults);

  } catch (error) {
    console.error('Workflow results error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}