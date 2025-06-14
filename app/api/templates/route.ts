// テンプレートAPI

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/utils/db';
import { getErrorMessage } from '@/lib/utils';
import { createTemplateSchema } from '@/lib/utils/validation';
import { assertEnvVars } from '@/lib/utils/env';
import { ZodError } from 'zod';

// GET /api/templates - テンプレート一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    
    const where: any = {};
    if (category) where.category = category;
    if (type) where.type = type;
    
    const templates = await prisma.template.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(templates);
  } catch (error) {
    const status = error instanceof ZodError ? 400 : 500;
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status }
    );
  }
}

// POST /api/templates - テンプレート作成
export async function POST(request: NextRequest) {
  try {
    assertEnvVars();
    const body = createTemplateSchema.parse(await request.json());
    
    const template = await prisma.template.create({
      data: {
        name: body.name,
        category: body.category,
        type: body.type,
        content: JSON.stringify(body.content),
        performance: body.performance ? JSON.stringify(body.performance) : null,
        tags: body.tags ? JSON.stringify(body.tags) : null
      }
    });
    
    return NextResponse.json(template);
  } catch (error) {
    const status = error instanceof ZodError ? 400 : 500;
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status }
    );
  }
}
