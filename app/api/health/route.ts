// ヘルスチェックエンドポイント

import { NextResponse } from 'next/server';
import prisma from '@/lib/utils/db';

export async function GET() {
  try {
    // データベース接続チェック
    await prisma.$queryRaw`SELECT 1`;
    
    // Gemini API キーチェック
    const hasGeminiApiKey = !!process.env.GEMINI_API_KEY;
    
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        geminiApi: hasGeminiApiKey ? 'configured' : 'missing',
      },
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };
    
    return NextResponse.json(status);
    
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'disconnected',
          geminiApi: !!process.env.GEMINI_API_KEY ? 'configured' : 'missing',
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
