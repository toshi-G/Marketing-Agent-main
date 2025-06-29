// 個別ワークフローAPI - /api/workflows/[id]

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/utils/db';
import { getErrorMessage } from '@/lib/utils';

// GET /api/workflows/[id] - 特定ワークフローの詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        agents: {
          orderBy: { createdAt: 'asc' }
        },
        results: {
          orderBy: { createdAt: 'desc' },
          take: 10 // 最新10件の結果
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
    console.error('Failed to fetch workflow:', error);
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
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    // ワークフローの存在確認
    const existingWorkflow = await prisma.workflow.findUnique({
      where: { id }
    });

    if (!existingWorkflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // ワークフローを削除（カスケード削除でエージェントと結果も削除される）
    await prisma.workflow.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Workflow deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to delete workflow:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/workflows/[id] - ワークフロー更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    // 更新可能なフィールドのみを抽出
    const allowedUpdates: { [key: string]: any } = {};
    
    if (body.name !== undefined) {
      allowedUpdates.name = body.name;
    }
    
    if (body.status !== undefined) {
      allowedUpdates.status = body.status;
      if (body.status === 'completed' || body.status === 'failed') {
        allowedUpdates.completedAt = new Date();
      }
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updatedWorkflow = await prisma.workflow.update({
      where: { id },
      data: allowedUpdates,
      include: {
        agents: {
          orderBy: { createdAt: 'asc' }
        },
        results: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    return NextResponse.json(updatedWorkflow);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    console.error('Failed to update workflow:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
