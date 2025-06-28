import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/utils/db';
import { z } from 'zod';
import { createApiLogger } from '@/app/lib/utils/logger';

const logger = createApiLogger('/api/templates');

// テンプレート作成用スキーマ
const createTemplateSchema = z.object({
  name: z.string().min(1, 'テンプレート名は必須です'),
  category: z.string().min(1, 'カテゴリは必須です'),
  type: z.string().min(1, 'タイプは必須です'),
  content: z.object({}).passthrough(), // 任意のオブジェクト
  performance: z.object({}).passthrough().optional(),
  tags: z.array(z.string()).optional()
});

// テンプレート更新用スキーマ
const updateTemplateSchema = createTemplateSchema.partial();

// テンプレート検索用スキーマ
const searchTemplateSchema = z.object({
  category: z.string().optional(),
  type: z.string().optional(),
  tags: z.string().optional(), // カンマ区切りの文字列
  search: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10)
});

export async function GET(request: NextRequest) {
  try {
    logger.info('Template list request received');
    
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    
    const {
      category,
      type,
      tags,
      search,
      page,
      limit
    } = searchTemplateSchema.parse(query);

    // 検索条件の構築
    const where: any = {};
    
    if (category) where.category = category;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { content: { contains: search } }
      ];
    }
    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim());
      where.tags = {
        contains: JSON.stringify(tagList[0]) // 簡易的なタグ検索
      };
    }

    // ページネーション
    const skip = (page - 1) * limit;

    // テンプレート取得
    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.template.count({ where })
    ]);

    // JSONパース
    const formattedTemplates = templates.map(template => ({
      ...template,
      content: typeof template.content === 'string' 
        ? JSON.parse(template.content) 
        : template.content,
      performance: template.performance 
        ? (typeof template.performance === 'string' 
           ? JSON.parse(template.performance) 
           : template.performance)
        : null,
      tags: template.tags 
        ? (typeof template.tags === 'string' 
           ? JSON.parse(template.tags) 
           : template.tags)
        : []
    }));

    logger.info('Templates retrieved successfully', {
      count: templates.length,
      total,
      page,
      limit
    });

    return NextResponse.json({
      templates: formattedTemplates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Failed to retrieve templates', { error });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.info('Template creation request received');
    
    const body = await request.json();
    const data = createTemplateSchema.parse(body);

    // データベースに保存
    const template = await prisma.template.create({
      data: {
        name: data.name,
        category: data.category,
        type: data.type,
        content: JSON.stringify(data.content),
        performance: data.performance ? JSON.stringify(data.performance) : null,
        tags: data.tags ? JSON.stringify(data.tags) : null
      }
    });

    // レスポンス用にパース
    const formattedTemplate = {
      ...template,
      content: JSON.parse(template.content),
      performance: template.performance ? JSON.parse(template.performance) : null,
      tags: template.tags ? JSON.parse(template.tags) : []
    };

    logger.info('Template created successfully', {
      templateId: template.id,
      name: template.name
    });

    return NextResponse.json(formattedTemplate, { status: 201 });

  } catch (error) {
    logger.error('Failed to create template', { error });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid template data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    logger.info('Template deletion request received', { templateId: id });

    // テンプレートの存在確認
    const existingTemplate = await prisma.template.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // テンプレート削除
    await prisma.template.delete({
      where: { id }
    });

    logger.info('Template deleted successfully', { templateId: id });

    return NextResponse.json({ message: 'Template deleted successfully' });

  } catch (error) {
    logger.error('Failed to delete template', { error });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
