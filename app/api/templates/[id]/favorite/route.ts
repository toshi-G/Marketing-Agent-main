// Template Favorite API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/utils/db';
import { getErrorMessage } from '@/lib/utils';

// PATCH /api/templates/[id]/favorite - お気に入り切り替え
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;
    const body = await request.json();
    const { isFavorite } = body;

    if (typeof isFavorite !== 'boolean') {
      return NextResponse.json(
        { error: 'isFavorite must be a boolean' },
        { status: 400 }
      );
    }

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

    // お気に入り状態を更新
    const updatedTemplate = await prisma.template.update({
      where: { id: templateId },
      data: { isFavorite }
    });

    return NextResponse.json({
      id: updatedTemplate.id,
      isFavorite: updatedTemplate.isFavorite,
      message: isFavorite ? 'Added to favorites' : 'Removed from favorites'
    });

  } catch (error) {
    console.error('Template favorite toggle error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}