// Interactive Workflow API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/utils/db';
import { getErrorMessage } from '@/lib/utils';

// GET /api/workflows/interactive - インタラクティブワークフロー一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }

    // インタラクティブワークフローを取得
    const workflows = await prisma.workflow.findMany({
      where: whereClause,
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
            error: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // インタラクティブ形式に変換
    const interactiveWorkflows = workflows.map(workflow => {
      const steps = workflow.agents.map((agent, index) => {
        const config = getAgentConfig(agent.type);
        
        let input = config.defaultInput;
        let output = null;
        
        try {
          if (agent.output) {
            output = JSON.parse(agent.output);
          }
        } catch (error) {
          output = { raw: agent.output };
        }

        return {
          id: agent.id,
          agentType: agent.type,
          title: config.name,
          description: config.description,
          status: mapAgentStatusToStepStatus(agent.status),
          input,
          output,
          reviewRequired: true,
          userApproval: agent.status === 'completed',
          executionTime: agent.completedAt 
            ? new Date(agent.completedAt).getTime() - new Date(agent.createdAt).getTime()
            : undefined,
          retryCount: 0,
          maxRetries: 3
        };
      });

      return {
        id: workflow.id,
        name: workflow.name,
        status: workflow.status,
        currentStep: steps.findIndex(s => s.status === 'running'),
        totalSteps: steps.length,
        steps,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt
      };
    });

    return NextResponse.json({
      workflows: interactiveWorkflows,
      pagination: {
        limit,
        offset,
        total: interactiveWorkflows.length,
        hasMore: workflows.length === limit
      }
    });

  } catch (error) {
    console.error('Interactive workflows fetch error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// POST /api/workflows/interactive - 新規インタラクティブワークフロー作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, steps } = body;

    if (!name || !steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: 'Name and steps are required' },
        { status: 400 }
      );
    }

    // ワークフローを作成
    const workflow = await prisma.workflow.create({
      data: {
        name,
        status: 'pending',
        metadata: JSON.stringify({
          type: 'interactive',
          totalSteps: steps.length
        })
      }
    });

    // エージェントステップを作成
    const agentPromises = steps.map((step: any, index: number) => 
      prisma.agent.create({
        data: {
          workflowId: workflow.id,
          type: step.agentType,
          status: 'pending',
          input: JSON.stringify(step.input || {}),
          metadata: JSON.stringify({
            stepIndex: index,
            reviewRequired: step.reviewRequired || true,
            maxRetries: step.maxRetries || 3
          })
        }
      })
    );

    await Promise.all(agentPromises);

    return NextResponse.json({
      id: workflow.id,
      message: 'Interactive workflow created successfully'
    });

  } catch (error) {
    console.error('Interactive workflow creation error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// エージェント設定を取得
function getAgentConfig(agentType: string) {
  const configs = {
    market_research: {
      name: '市場調査エージェント',
      description: '市場トレンドとターゲット分析',
      defaultInput: { target: 'ビジネス', budget: '100万円' }
    },
    content_scraping: {
      name: 'コンテンツスクレイピングエージェント',
      description: 'SNSから高エンゲージメントコンテンツを収集',
      defaultInput: { platform: 'Instagram', keywords: 'マーケティング' }
    },
    nlp_classification: {
      name: 'NLP分類エージェント',
      description: 'コンテンツを感情・構造別に分類',
      defaultInput: { analysisType: 'sentiment' }
    },
    template_optimization: {
      name: 'テンプレート最適化エージェント',
      description: '成功パターンをテンプレート化',
      defaultInput: { optimizationGoal: 'conversion' }
    },
    business_strategy: {
      name: '商品設計エージェント',
      description: 'セールスファネルと商品戦略設計',
      defaultInput: { productType: 'digital', priceRange: '1万円〜10万円' }
    },
    content_creation: {
      name: 'コンテンツ生成エージェント',
      description: 'LP・SNS・メールコンテンツ生成',
      defaultInput: { contentType: 'landing_page', tone: 'professional' }
    },
    copy_generation: {
      name: 'コピー生成エージェント',
      description: 'フックとコピーバリエーション生成',
      defaultInput: { hookType: 'curiosity', quantity: 10 }
    },
    optimization_archive: {
      name: '最適化・保存エージェント',
      description: '成功パターンをアーカイブ化',
      defaultInput: { archiveType: 'template' }
    }
  };

  return configs[agentType as keyof typeof configs] || {
    name: agentType,
    description: 'AIエージェント',
    defaultInput: {}
  };
}

// エージェントステータスをステップステータスにマッピング
function mapAgentStatusToStepStatus(agentStatus: string) {
  switch (agentStatus) {
    case 'completed': return 'completed';
    case 'running': return 'running';
    case 'failed': return 'failed';
    case 'pending': return 'pending';
    default: return 'pending';
  }
}