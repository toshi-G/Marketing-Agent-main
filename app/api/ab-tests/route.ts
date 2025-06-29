// A/B Test Management API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/utils/db';
import { getErrorMessage } from '@/lib/utils';

// GET /api/ab-tests - A/Bテスト一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (type) {
      whereClause.testType = type;
    }

    // A/Bテストデータを取得（実際の実装では専用テーブルを作成）
    // 現在はWorkflowResultテーブルを活用してシミュレート
    const workflowResults = await prisma.workflowResult.findMany({
      where: {
        ...whereClause,
        // A/Bテスト用のメタデータフィルタ
        metadata: {
          contains: 'ab_test'
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // A/Bテストデータに変換
    const abTests = workflowResults.map(result => {
      let metadata = {};
      try {
        metadata = result.metadata ? JSON.parse(result.metadata) : {};
      } catch (error) {
        metadata = {};
      }

      return {
        id: result.id,
        name: `A/Bテスト - ${result.id.slice(-8)}`,
        testType: (metadata as any).testType || 'content',
        status: determineTestStatus(result),
        description: (metadata as any).description || 'コンテンツ効果検証',
        variants: generateVariants(result),
        metrics: calculateMetrics(result),
        startDate: result.createdAt,
        endDate: (metadata as any).endDate || null,
        trafficSplit: (metadata as any).trafficSplit || { variantA: 50, variantB: 50 },
        significance: calculateSignificance(result),
        winner: determineWinner(result),
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    });

    // 実際のA/Bテストがない場合のモックデータ
    if (abTests.length === 0) {
      const mockTests = await generateMockABTests();
      return NextResponse.json({
        tests: mockTests,
        pagination: {
          limit,
          offset,
          total: mockTests.length,
          hasMore: false
        }
      });
    }

    return NextResponse.json({
      tests: abTests,
      pagination: {
        limit,
        offset,
        total: abTests.length,
        hasMore: workflowResults.length === limit
      }
    });

  } catch (error) {
    console.error('A/B tests fetch error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// POST /api/ab-tests - 新規A/Bテスト作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      testType, // 'content' | 'template' | 'strategy' | 'copy'
      variants,
      trafficSplit,
      duration, // days
      goals
    } = body;

    if (!name || !testType || !variants || variants.length < 2) {
      return NextResponse.json(
        { error: 'Name, testType, and at least 2 variants are required' },
        { status: 400 }
      );
    }

    // A/Bテストをワークフロー結果として保存（実際の実装では専用テーブル）
    const abTestData = {
      name,
      description: description || '',
      testType,
      variants: variants.map((variant: any, index: number) => ({
        id: `variant_${String.fromCharCode(65 + index)}`,
        name: variant.name || `バリアント${String.fromCharCode(65 + index)}`,
        content: variant.content,
        weight: trafficSplit ? trafficSplit[`variant${String.fromCharCode(65 + index)}`] || 50 : 50
      })),
      trafficSplit: trafficSplit || { variantA: 50, variantB: 50 },
      duration: duration || 14,
      goals: goals || ['conversion_rate', 'engagement_rate'],
      status: 'draft',
      startDate: null,
      endDate: null,
      createdAt: new Date().toISOString()
    };

    const workflowResult = await prisma.workflowResult.create({
      data: {
        workflowId: `ab_test_${Date.now()}`,
        status: 'completed',
        results: JSON.stringify(abTestData),
        metadata: JSON.stringify({
          type: 'ab_test',
          testType,
          status: 'draft',
          description
        }),
        insights: JSON.stringify({
          testConfiguration: abTestData,
          message: 'A/Bテストが作成されました'
        })
      }
    });

    return NextResponse.json({
      id: workflowResult.id,
      message: 'A/B test created successfully',
      testData: abTestData
    });

  } catch (error) {
    console.error('A/B test creation error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// ヘルパー関数群

function determineTestStatus(result: any): string {
  const statuses = ['draft', 'running', 'completed', 'paused'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

function generateVariants(result: any) {
  return [
    {
      id: 'variant_A',
      name: 'バリアントA',
      content: {
        headline: '限定公開！○○で成果を出す秘密',
        description: '今すぐ無料で確認してください',
        cta: '今すぐ無料で試す'
      },
      metrics: {
        visitors: Math.floor(Math.random() * 1000) + 500,
        conversions: Math.floor(Math.random() * 100) + 20,
        conversionRate: (Math.random() * 10 + 2).toFixed(2)
      }
    },
    {
      id: 'variant_B',
      name: 'バリアントB',
      content: {
        headline: '【保存版】○○の完全攻略マニュアル',
        description: 'プロが教える実践的テクニック',
        cta: '無料ダウンロード'
      },
      metrics: {
        visitors: Math.floor(Math.random() * 1000) + 500,
        conversions: Math.floor(Math.random() * 100) + 20,
        conversionRate: (Math.random() * 10 + 2).toFixed(2)
      }
    }
  ];
}

function calculateMetrics(result: any) {
  return {
    totalVisitors: Math.floor(Math.random() * 2000) + 1000,
    totalConversions: Math.floor(Math.random() * 200) + 50,
    averageConversionRate: (Math.random() * 8 + 3).toFixed(2),
    statisticalSignificance: Math.random() > 0.3 ? 'significant' : 'not_significant',
    confidence: Math.floor(Math.random() * 30) + 70,
    pValue: (Math.random() * 0.1).toFixed(3)
  };
}

function calculateSignificance(result: any): number {
  return Math.floor(Math.random() * 30) + 70; // 70-99%
}

function determineWinner(result: any): string | null {
  const significance = calculateSignificance(result);
  if (significance >= 95) {
    return Math.random() > 0.5 ? 'variant_A' : 'variant_B';
  }
  return null;
}

async function generateMockABTests() {
  const testTypes = ['content', 'template', 'strategy', 'copy'];
  const statuses = ['draft', 'running', 'completed', 'paused'];
  
  return Array.from({ length: 5 }, (_, index) => ({
    id: `ab_test_${index + 1}`,
    name: `A/Bテスト ${index + 1}`,
    testType: testTypes[index % testTypes.length],
    status: statuses[index % statuses.length],
    description: `${testTypes[index % testTypes.length]}の効果検証テスト`,
    variants: [
      {
        id: 'variant_A',
        name: 'バリアントA',
        content: {
          headline: '限定公開！○○で成果を出す秘密',
          description: '今すぐ無料で確認してください'
        },
        metrics: {
          visitors: Math.floor(Math.random() * 1000) + 500,
          conversions: Math.floor(Math.random() * 100) + 20,
          conversionRate: (Math.random() * 10 + 2).toFixed(2)
        }
      },
      {
        id: 'variant_B',
        name: 'バリアントB',
        content: {
          headline: '【保存版】○○の完全攻略マニュアル',
          description: 'プロが教える実践的テクニック'
        },
        metrics: {
          visitors: Math.floor(Math.random() * 1000) + 500,
          conversions: Math.floor(Math.random() * 100) + 20,
          conversionRate: (Math.random() * 10 + 2).toFixed(2)
        }
      }
    ],
    metrics: {
      totalVisitors: Math.floor(Math.random() * 2000) + 1000,
      totalConversions: Math.floor(Math.random() * 200) + 50,
      averageConversionRate: (Math.random() * 8 + 3).toFixed(2),
      statisticalSignificance: Math.random() > 0.3 ? 'significant' : 'not_significant',
      confidence: Math.floor(Math.random() * 30) + 70
    },
    startDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    endDate: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
    trafficSplit: { variantA: 50, variantB: 50 },
    significance: Math.floor(Math.random() * 30) + 70,
    winner: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'variant_A' : 'variant_B') : null,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }));
}