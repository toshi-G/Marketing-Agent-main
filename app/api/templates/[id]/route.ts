import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/utils/db';
import { z } from 'zod';
import { createApiLogger } from '@/app/lib/utils/logger';

const logger = createApiLogger('/api/templates/[id]');

// テンプレート更新用スキーマ
const updateTemplateSchema = z.object({
  name: z.string().min(1, 'テンプレート名は必須です').optional(),
  category: z.string().min(1, 'カテゴリは必須です').optional(),
  type: z.string().min(1, 'タイプは必須です').optional(),
  content: z.object({}).passthrough().optional(),
  performance: z.object({}).passthrough().optional(),
  tags: z.array(z.string()).optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    logger.info('Template detail request received', { templateId: id });

    const template = await prisma.template.findUnique({
      where: { id }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // JSONパース
    const formattedTemplate = {
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
    };

    logger.info('Template retrieved successfully', { templateId: id });

    return NextResponse.json(formattedTemplate);

  } catch (error) {
    logger.error('Failed to retrieve template', { error });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    logger.info('Template update request received', { templateId: id });

    const body = await request.json();
    const data = updateTemplateSchema.parse(body);

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

    // 更新データの準備
    const updateData: any = {};
    
    if (data.name) updateData.name = data.name;
    if (data.category) updateData.category = data.category;
    if (data.type) updateData.type = data.type;
    if (data.content) updateData.content = JSON.stringify(data.content);
    if (data.performance) updateData.performance = JSON.stringify(data.performance);
    if (data.tags) updateData.tags = JSON.stringify(data.tags);

    // テンプレート更新
    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: updateData
    });

    // レスポンス用にパース
    const formattedTemplate = {
      ...updatedTemplate,
      content: JSON.parse(updatedTemplate.content),
      performance: updatedTemplate.performance ? JSON.parse(updatedTemplate.performance) : null,
      tags: updatedTemplate.tags ? JSON.parse(updatedTemplate.tags) : []
    };

    logger.info('Template updated successfully', { templateId: id });

    return NextResponse.json(formattedTemplate);

  } catch (error) {
    logger.error('Failed to update template', { error });
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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