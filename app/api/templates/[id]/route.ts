import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/utils/db';
import { getErrorMessage } from '@/lib/utils';

// GET /api/templates/[id] - テンプレート詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;

    const template = await prisma.template.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // データを整形
    let content = {};
    let performance = {};
    let tags: string[] = [];

    try {
      content = template.content ? JSON.parse(template.content) : {};
    } catch (error) {
      content = { raw: template.content };
    }

    try {
      performance = template.performance ? JSON.parse(template.performance) : {};
    } catch (error) {
      performance = {};
    }

    try {
      tags = template.tags ? template.tags.split(',').filter(Boolean) : [];
    } catch (error) {
      tags = [];
    }

    const formattedTemplate = {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      content,
      performance,
      tags,
      isPublic: template.isPublic,
      isFavorite: template.isFavorite,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      createdBy: template.createdBy,
      metadata: {
        industry: template.industry,
        targetAudience: template.targetAudience,
        platform: template.platform
      }
    };

    return NextResponse.json(formattedTemplate);

  } catch (error) {
    console.error('Template detail error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// PUT /api/templates/[id] - テンプレート更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;
    const body = await request.json();

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

    // 更新データの準備
    const updateData: any = {
      updatedAt: new Date()
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.content !== undefined) updateData.content = JSON.stringify(body.content);
    if (body.tags !== undefined) updateData.tags = Array.isArray(body.tags) ? body.tags.join(',') : body.tags;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.metadata?.industry !== undefined) updateData.industry = body.metadata.industry;
    if (body.metadata?.targetAudience !== undefined) updateData.targetAudience = body.metadata.targetAudience;
    if (body.metadata?.platform !== undefined) updateData.platform = body.metadata.platform;

    // テンプレート更新
    const updatedTemplate = await prisma.template.update({
      where: { id: templateId },
      data: updateData
    });

    return NextResponse.json({
      id: updatedTemplate.id,
      message: 'Template updated successfully'
    });

  } catch (error) {
    console.error('Template update error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - テンプレート削除
export async function DELETE(
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

    // テンプレート削除
    await prisma.template.delete({
      where: { id: templateId }
    });

    return NextResponse.json({ 
      message: 'Template deleted successfully' 
    });

  } catch (error) {
    console.error('Template deletion error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}