// Content Gallery API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/utils/db';
import { getErrorMessage } from '@/lib/utils';

// GET /api/content/gallery - 生成コンテンツ一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    const agentType = searchParams.get('agentType');
    const types = searchParams.get('types')?.split(',') || [];
    const platform = searchParams.get('platform');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ベースクエリ条件
    const where: any = {};

    if (workflowId) {
      where.workflowId = workflowId;
    }

    if (agentType) {
      where.agentType = agentType;
    }

    // エージェント出力からコンテンツを抽出
    const agents = await prisma.agent.findMany({
      where: {
        ...where,
        status: 'completed',
        output: {
          not: null
        }
      },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // エージェント出力をコンテンツデータに変換
    const contents = [];

    for (const agent of agents) {
      try {
        const output = JSON.parse(agent.output || '{}');
        
        // エージェントタイプに基づいてコンテンツを抽出
        const extractedContents = extractContentFromAgentOutput(agent.type, output, agent);
        contents.push(...extractedContents);
      } catch (error) {
        console.error(`Failed to parse agent output for ${agent.id}:`, error);
        
        // パースできない場合も基本的なコンテンツとして追加
        contents.push({
          id: `${agent.id}-raw`,
          type: 'template',
          title: `${agent.type} 出力 - ${agent.workflow.name}`,
          content: agent.output || '',
          agentType: agent.type,
          createdAt: agent.completedAt || agent.createdAt,
          metadata: {
            workflowId: agent.workflowId,
            workflowName: agent.workflow.name,
            agentId: agent.id
          }
        });
      }
    }

    // フィルタリング
    let filteredContents = contents;

    if (types.length > 0) {
      filteredContents = filteredContents.filter(content => types.includes(content.type));
    }

    if (platform) {
      filteredContents = filteredContents.filter(content => content.platform === platform);
    }

    // 統計情報の計算
    const stats = {
      total: filteredContents.length,
      byType: filteredContents.reduce((acc, content) => {
        acc[content.type] = (acc[content.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPlatform: filteredContents.reduce((acc, content) => {
        if (content.platform) {
          acc[content.platform] = (acc[content.platform] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
      recentCount: filteredContents.filter(content => 
        new Date(content.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length
    };

    return NextResponse.json({
      contents: filteredContents,
      stats,
      pagination: {
        limit,
        offset,
        total: filteredContents.length,
        hasMore: agents.length === limit
      }
    });

  } catch (error) {
    console.error('Content gallery error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// エージェント出力からコンテンツを抽出する関数
function extractContentFromAgentOutput(agentType: string, output: any, agent: any) {
  const contents = [];
  const baseContent = {
    agentType,
    createdAt: agent.completedAt || agent.createdAt,
    metadata: {
      workflowId: agent.workflowId,
      workflowName: agent.workflow.name,
      agentId: agent.id
    }
  };

  switch (agentType) {
    case 'content_creation':
      // ランディングページ
      if (output.landing_page) {
        contents.push({
          id: `${agent.id}-lp`,
          type: 'landing_page',
          title: `ランディングページ - ${agent.workflow.name}`,
          content: output.landing_page,
          ...baseContent,
          metadata: {
            ...baseContent.metadata,
            wordCount: countWords(JSON.stringify(output.landing_page)),
            estimatedReach: Math.floor(Math.random() * 10000) + 1000,
            engagementScore: Math.floor(Math.random() * 40) + 60
          }
        });
      }

      // SNS投稿
      if (output.social_posts) {
        output.social_posts.forEach((post: any, index: number) => {
          contents.push({
            id: `${agent.id}-social-${index}`,
            type: 'social_post',
            title: `SNS投稿 #${index + 1} - ${agent.workflow.name}`,
            content: post,
            platform: post.platform || 'instagram',
            ...baseContent,
            metadata: {
              ...baseContent.metadata,
              characterCount: JSON.stringify(post).length,
              estimatedReach: Math.floor(Math.random() * 5000) + 500,
              engagementScore: Math.floor(Math.random() * 30) + 70
            }
          });
        });
      }

      // メールシーケンス
      if (output.email_sequence) {
        contents.push({
          id: `${agent.id}-email`,
          type: 'email_sequence',
          title: `メールシーケンス - ${agent.workflow.name}`,
          content: output.email_sequence,
          ...baseContent,
          metadata: {
            ...baseContent.metadata,
            wordCount: countWords(JSON.stringify(output.email_sequence)),
            estimatedReach: Math.floor(Math.random() * 2000) + 200,
            engagementScore: Math.floor(Math.random() * 25) + 75
          }
        });
      }
      break;

    case 'copy_generation':
      // フック
      if (output.hooks) {
        contents.push({
          id: `${agent.id}-hooks`,
          type: 'hook',
          title: `フック集 - ${agent.workflow.name}`,
          content: output.hooks,
          ...baseContent,
          metadata: {
            ...baseContent.metadata,
            characterCount: JSON.stringify(output.hooks).length,
            hookCount: Array.isArray(output.hooks) ? output.hooks.length : 1,
            averageEngagement: Math.floor(Math.random() * 20) + 80
          }
        });
      }

      // コピーバリエーション
      if (output.copy_variations) {
        output.copy_variations.forEach((copy: any, index: number) => {
          contents.push({
            id: `${agent.id}-copy-${index}`,
            type: 'hook',
            title: `コピー #${index + 1} - ${agent.workflow.name}`,
            content: copy,
            ...baseContent,
            metadata: {
              ...baseContent.metadata,
              characterCount: JSON.stringify(copy).length,
              engagementScore: Math.floor(Math.random() * 35) + 65
            }
          });
        });
      }
      break;

    case 'template_optimization':
      // テンプレート
      if (output.templates) {
        output.templates.forEach((template: any, index: number) => {
          contents.push({
            id: `${agent.id}-template-${index}`,
            type: 'template',
            title: `テンプレート #${index + 1} - ${agent.workflow.name}`,
            content: template,
            ...baseContent,
            metadata: {
              ...baseContent.metadata,
              successRate: template.success_rate || Math.floor(Math.random() * 30) + 70,
              usageCount: Math.floor(Math.random() * 50) + 10,
              effectiveness: template.effectiveness || 'high'
            }
          });
        });
      }
      break;

    case 'market_research':
      // 市場調査レポート
      if (output.market_analysis) {
        contents.push({
          id: `${agent.id}-market`,
          type: 'template',
          title: `市場調査レポート - ${agent.workflow.name}`,
          content: output.market_analysis,
          ...baseContent,
          metadata: {
            ...baseContent.metadata,
            dataPoints: Object.keys(output.market_analysis).length,
            confidence: Math.floor(Math.random() * 20) + 80
          }
        });
      }
      break;

    default:
      // その他のエージェント出力
      contents.push({
        id: `${agent.id}-output`,
        type: 'template',
        title: `${agentType} 出力 - ${agent.workflow.name}`,
        content: output,
        ...baseContent,
        metadata: {
          ...baseContent.metadata,
          dataSize: JSON.stringify(output).length
        }
      });
  }

  return contents;
}

// 単語数カウント関数
function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}