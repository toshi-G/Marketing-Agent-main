// ワークフローAPI - ルートハンドラー

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/utils/db';
import { AgentFactory, AGENT_SEQUENCE } from '@/lib/agents';
import { AgentType, WorkflowStatus } from '@/lib/api/types';
import { getErrorMessage } from '@/lib/utils';
import { startWorkflowSchema } from '@/lib/utils/validation';
import { assertEnvVars } from '@/lib/utils/env';
import { ZodError } from 'zod';

// GET /api/workflows - ワークフロー一覧取得
export async function GET() {
  try {
    const workflows = await prisma.workflow.findMany({
      include: {
        agents: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(workflows);
  } catch (error) {
    const status = error instanceof Error && 'issues' in error ? 400 : 500;
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status }
    );
  }
}

// POST /api/workflows - 新規ワークフロー作成
export async function POST(request: NextRequest) {
  try {
    assertEnvVars();
    const body = startWorkflowSchema.parse(await request.json());
    const { name, initialInput } = body;
    
    // ワークフローを作成
    const workflow = await prisma.workflow.create({
      data: {
        name: name || `ワークフロー ${new Date().toLocaleString('ja-JP')}`,
        status: WorkflowStatus.PENDING,
        agents: {
          create: AGENT_SEQUENCE.map((type, index) => ({
            type,
            status: WorkflowStatus.PENDING,
            input: index === 0 ? JSON.stringify(initialInput || {}) : null
          }))
        }
      },
      include: {
        agents: true
      }
    });
    
    // 非同期でワークフローを実行
    executeWorkflow(workflow.id).catch(error => {
      console.error('Workflow execution error:', error);
    });
    
    return NextResponse.json(workflow);
  } catch (error) {
    const status = error instanceof ZodError ? 400 : 500;
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status }
    );
  }
}

// ワークフロー実行関数
async function executeWorkflow(workflowId: string) {
  try {
    // ワークフローステータスを実行中に更新
    await prisma.workflow.update({
      where: { id: workflowId },
      data: { status: WorkflowStatus.RUNNING }
    });
    
    // 前のエージェントの出力を保存
    const previousOutputs = new Map<AgentType, any>();
    
    // 各エージェントを順番に実行
    for (const agentType of AGENT_SEQUENCE) {
      // エージェント情報を取得
      const agentRecord = await prisma.agent.findFirst({
        where: {
          workflowId,
          type: agentType
        }
      });
      
      if (!agentRecord) {
        throw new Error(`Agent ${agentType} not found`);
      }
      
      try {
        // エージェントを作成
        const agent = AgentFactory.create(agentType);
        
        // 入力データを準備
        const input = agentRecord.input ? JSON.parse(agentRecord.input) : {};
        
        // エージェントを実行
        const output = await agent.execute({
          workflowId,
          agentId: agentRecord.id,
          input,
          previousOutputs
        });
        
        // 出力を保存
        previousOutputs.set(agentType, output);
        
      } catch (error) {
        console.error(`Agent ${agentType} failed:`, error);
        
        // ワークフローを失敗状態に更新
        await prisma.workflow.update({
          where: { id: workflowId },
          data: {
            status: WorkflowStatus.FAILED,
            completedAt: new Date()
          }
        });
        
        throw error;
      }
    }
    
    // ワークフローを完了状態に更新
    await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        status: WorkflowStatus.COMPLETED,
        completedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('Workflow execution error:', error);
    
    // エラーが発生した場合、ワークフローを失敗状態に更新
    await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        status: WorkflowStatus.FAILED,
        completedAt: new Date()
      }
    }).catch(() => {}); // 更新エラーは無視
  }
}
