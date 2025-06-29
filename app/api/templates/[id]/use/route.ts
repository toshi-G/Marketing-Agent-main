// Template Use API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/utils/db';
import { getErrorMessage } from '@/lib/utils';

// POST /api/templates/[id]/use - テンプレート使用
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;

    // テンプレートの存在確認
    const existingTemplate = await prisma.template.findUnique({
      where: { id: templateId }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // パフォーマンスデータを更新
    let performance = {
      successRate: 0,
      usageCount: 0,
      averageEngagement: 0,
      conversionRate: 0,
      lastUsed: null
    };

    try {
      if (existingTemplate.performance) {
        performance = JSON.parse(existingTemplate.performance);
      }
    } catch (error) {
      console.error('Failed to parse existing performance data:', error);
    }

    // 使用回数を増やし、最終使用日時を更新
    const updatedPerformance = {
      ...performance,
      usageCount: (performance.usageCount || 0) + 1,
      lastUsed: new Date().toISOString()
    };

    // テンプレートを更新
    const updatedTemplate = await prisma.template.update({
      where: { id: templateId },
      data: {
        performance: JSON.stringify(updatedPerformance),
        updatedAt: new Date()
      }
    });

    // テンプレートコンテンツを取得してレスポンス
    let content = {};
    try {
      content = JSON.parse(updatedTemplate.content);
    } catch (error) {
      content = { raw: updatedTemplate.content };
    }

    return NextResponse.json({
      id: updatedTemplate.id,
      name: updatedTemplate.name,
      content,
      performance: updatedPerformance,
      message: 'Template used successfully'
    });

  } catch (error) {
    console.error('Template use error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}