// ワークフロー詳細API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/utils/db';
import { getErrorMessage } from '@/lib/utils';

// GET /api/workflows/[id] - ワークフロー詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: params.id },
      include: {
        agents: {
          orderBy: { createdAt: 'asc' }
        },
        results: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(workflow);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/workflows/[id] - ワークフロー削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.workflow.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
