// ヘルスチェックエンドポイント

import { NextResponse } from 'next/server';
import prisma, { testDatabaseConnection } from '@/lib/utils/db';

export async function GET() {
  const timestamp = new Date().toISOString();
  let dbStatus = 'disconnected';
  let dbError = null;

  try {
    // データベース接続テスト
    const isConnected = await testDatabaseConnection();
    if (isConnected) {
      // 実際にクエリを実行してテスト
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    }
  } catch (error) {
    dbStatus = 'disconnected';
    dbError = error instanceof Error ? error.message : 'Unknown database error';
  }

  // Gemini API チェック
  const hasGeminiApiKey = !!process.env.GEMINI_API_KEY;
  let geminiStatus = hasGeminiApiKey ? 'configured' : 'missing';
  let geminiError = null;
  
  // APIキーが設定されている場合、実際に接続テスト（簡単なリクエスト）
  if (hasGeminiApiKey) {
    try {
      const { getGeminiClient } = await import('@/lib/api/client');
      const client = getGeminiClient();
      
      // 軽量なテストリクエスト
      await client.sendMessage({
        contents: [
          { role: 'user', parts: [{ text: 'Hello' }] }
        ],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0
        }
      });
      
      geminiStatus = 'connected';
    } catch (error) {
      geminiStatus = 'error';
      geminiError = error instanceof Error ? error.message : 'Unknown Gemini API error';
    }
  }

  // 環境変数チェック
  const hasDbUrl = !!process.env.DATABASE_URL;
  
  // 全体のヘルス状態判定
  const isHealthy = dbStatus === 'connected' && geminiStatus === 'connected' && hasDbUrl;

  const status = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp,
    checks: {
      database: {
        status: dbStatus,
        url_configured: hasDbUrl,
        error: dbError
      },
      geminiApi: {
        status: geminiStatus,
        key_configured: hasGeminiApiKey,
        error: geminiError
      },
      environment: {
        node_env: process.env.NODE_ENV || 'development',
        database_url_set: hasDbUrl
      }
    },
    version: '1.0.0',
    uptime: process.uptime()
  };

  const statusCode = isHealthy ? 200 : 503;
  return NextResponse.json(status, { status: statusCode });
}
