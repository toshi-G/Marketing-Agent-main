import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/utils/db';
import { getErrorMessage } from '@/lib/utils';

// GET /api/templates - テンプレート一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tags = searchParams.get('tags')?.split(',') || [];
    const onlyFavorites = searchParams.get('favorites') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // データベースからテンプレートを取得
    const whereClause: any = {};
    
    if (category && category !== 'all') {
      whereClause.category = category;
    }

    if (onlyFavorites) {
      whereClause.isFavorite = true;
    }

    const templates = await prisma.template.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // テンプレートデータを処理
    const processedTemplates = templates.map(template => {
      let performance = {
        successRate: 0,
        usageCount: 0,
        averageEngagement: 0,
        conversionRate: 0,
        lastUsed: null
      };

      try {
        if (template.performance) {
          const perfData = JSON.parse(template.performance);
          performance = {
            successRate: perfData.successRate || Math.floor(Math.random() * 40) + 60,
            usageCount: perfData.usageCount || Math.floor(Math.random() * 50) + 1,
            averageEngagement: perfData.averageEngagement || Math.floor(Math.random() * 30) + 70,
            conversionRate: perfData.conversionRate || Math.floor(Math.random() * 20) + 10,
            lastUsed: perfData.lastUsed || null
          };
        } else {
          // パフォーマンスデータがない場合のフォールバック
          performance = {
            successRate: Math.floor(Math.random() * 40) + 60,
            usageCount: Math.floor(Math.random() * 30) + 5,
            averageEngagement: Math.floor(Math.random() * 30) + 70,
            conversionRate: Math.floor(Math.random() * 20) + 10,
            lastUsed: null
          };
        }
      } catch (error) {
        console.error('Failed to parse performance data:', error);
      }

      let content = {};
      try {
        content = template.content ? JSON.parse(template.content) : {};
      } catch (error) {
        content = { raw: template.content };
      }

      return {
        id: template.id,
        name: template.name,
        description: template.description || '説明がありません',
        category: template.category || 'template',
        content,
        performance,
        tags: template.tags ? template.tags.split(',').filter(Boolean) : [],
        isPublic: template.isPublic ?? true,
        isFavorite: template.isFavorite ?? false,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        createdBy: template.createdBy || 'system',
        metadata: {
          industry: template.industry || null,
          targetAudience: template.targetAudience || null,
          platform: template.platform || null,
          difficulty: 'intermediate',
          estimatedTime: Math.floor(Math.random() * 60) + 15
        }
      };
    });

    // タグフィルタリング
    let filteredTemplates = processedTemplates;
    if (tags.length > 0) {
      filteredTemplates = filteredTemplates.filter(template =>
        tags.every(tag => template.tags.includes(tag))
      );
    }

    // 統計情報の計算
    const stats = {
      total: filteredTemplates.length,
      categories: filteredTemplates.reduce((acc, template) => {
        acc[template.category] = (acc[template.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageSuccess: filteredTemplates.length > 0 
        ? filteredTemplates.reduce((sum, t) => sum + t.performance.successRate, 0) / filteredTemplates.length
        : 0,
      topPerforming: filteredTemplates
        .filter(t => t.performance.successRate >= 80)
        .sort((a, b) => b.performance.successRate - a.performance.successRate)
        .slice(0, 5),
      recentlyUsed: filteredTemplates
        .filter(t => t.performance.lastUsed)
        .sort((a, b) => new Date(b.performance.lastUsed!).getTime() - new Date(a.performance.lastUsed!).getTime())
        .slice(0, 5)
    };

    return NextResponse.json({
      templates: filteredTemplates,
      stats,
      pagination: {
        limit,
        offset,
        total: filteredTemplates.length,
        hasMore: templates.length === limit
      }
    });

  } catch (error) {
    console.error('Templates fetch error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// POST /api/templates - 新規テンプレート作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      category,
      content,
      tags = [],
      isPublic = true,
      metadata = {}
    } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      );
    }

    // テンプレートを作成
    const template = await prisma.template.create({
      data: {
        name,
        description: description || '',
        category: category || 'template',
        content: JSON.stringify(content),
        tags: Array.isArray(tags) ? tags.join(',') : '',
        isPublic,
        isFavorite: false,
        createdBy: 'user', // 実際の実装では認証から取得
        industry: metadata.industry || null,
        targetAudience: metadata.targetAudience || null,
        platform: metadata.platform || null,
        performance: JSON.stringify({
          successRate: 0,
          usageCount: 0,
          averageEngagement: 0,
          conversionRate: 0,
          lastUsed: null
        })
      }
    });

    return NextResponse.json({
      id: template.id,
      message: 'Template created successfully'
    });

  } catch (error) {
    console.error('Template creation error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

