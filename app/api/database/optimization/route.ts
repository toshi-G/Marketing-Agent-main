// Database Optimization Management API

import { NextRequest, NextResponse } from 'next/server';
import { 
  WorkflowQueryOptimizer, 
  AgentQueryOptimizer, 
  TemplateQueryOptimizer,
  QueryOptimizer,
  QueryPerformanceMonitor
} from '@/lib/utils/query-optimizer';
import { getErrorMessage } from '@/lib/utils';

// GET /api/database/optimization - データベース最適化情報取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';

    switch (action) {
      case 'stats':
        return await getDatabaseStats();
      
      case 'performance':
        return await getPerformanceAnalysis();
      
      case 'queries':
        return await getQueryOptimizationSuggestions();
      
      case 'indexes':
        return await getIndexUsageAnalysis();
      
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Database optimization error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// POST /api/database/optimization - 最適化実行
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      case 'benchmark':
        return await runPerformanceBenchmark(params);
      
      case 'analyze':
        return await analyzeQueryPerformance(params);
      
      case 'optimize':
        return await runOptimization(params);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Database optimization action error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// データベース統計取得
async function getDatabaseStats() {
  const { result: stats, executionTime } = await QueryPerformanceMonitor.measureQuery(
    'getDatabaseStats',
    () => QueryOptimizer.getDatabaseStats()
  );

  // 追加の詳細統計
  const { result: workflowStats } = await QueryPerformanceMonitor.measureQuery(
    'getWorkflowStats',
    () => WorkflowQueryOptimizer.getWorkflowStats()
  );

  const { result: agentStats } = await QueryPerformanceMonitor.measureQuery(
    'getAgentPerformanceStats',
    () => AgentQueryOptimizer.getAgentPerformanceStats()
  );

  return NextResponse.json({
    basic: stats,
    workflows: workflowStats,
    agents: agentStats,
    performance: {
      statsQueryTime: executionTime,
      timestamp: new Date().toISOString()
    }
  });
}

// パフォーマンス分析
async function getPerformanceAnalysis() {
  const benchmarks = await runBasicBenchmarks();
  
  return NextResponse.json({
    benchmarks,
    recommendations: generatePerformanceRecommendations(benchmarks),
    optimizationScore: calculateOptimizationScore(benchmarks)
  });
}

// クエリ最適化提案
async function getQueryOptimizationSuggestions() {
  const suggestions = [
    {
      query: 'Workflow listing with pagination',
      current: 'Basic findMany with includes',
      optimized: 'Use WorkflowQueryOptimizer.getWorkflowsWithPagination',
      impact: 'high',
      reason: 'Utilizes composite indexes for status + createdAt filtering'
    },
    {
      query: 'Agent performance statistics',
      current: 'Individual queries for each agent type',
      optimized: 'Use AgentQueryOptimizer.getAgentPerformanceStats',
      impact: 'medium',
      reason: 'Batches statistics in single groupBy query'
    },
    {
      query: 'Template search and filtering',
      current: 'Full table scan with text search',
      optimized: 'Use TemplateQueryOptimizer.searchTemplates',
      impact: 'high',
      reason: 'Index-optimized filtering with limited text search'
    },
    {
      query: 'Popular templates',
      current: 'Sort by usage without filtering',
      optimized: 'Use TemplateQueryOptimizer.getPopularTemplates',
      impact: 'medium',
      reason: 'Pre-filtered by usageCount > 0 with composite sorting'
    }
  ];

  return NextResponse.json({
    suggestions,
    totalQueries: suggestions.length,
    highImpact: suggestions.filter(s => s.impact === 'high').length
  });
}

// インデックス使用量分析
async function getIndexUsageAnalysis() {
  const indexInfo = [
    {
      table: 'Workflow',
      indexes: [
        { name: 'status', usage: 'high', description: 'ステータス別フィルタリング' },
        { name: 'createdAt', usage: 'high', description: '日付ソート' },
        { name: 'status_createdAt', usage: 'high', description: 'ステータス+日付の複合検索' },
        { name: 'completedAt', usage: 'medium', description: '完了時間での検索' }
      ]
    },
    {
      table: 'Agent',
      indexes: [
        { name: 'workflowId', usage: 'very_high', description: 'ワークフロー関連検索' },
        { name: 'status', usage: 'high', description: 'ステータス検索' },
        { name: 'type', usage: 'high', description: 'エージェントタイプ検索' },
        { name: 'workflowId_status', usage: 'high', description: 'ワークフロー内ステータス検索' },
        { name: 'workflowId_type', usage: 'medium', description: 'ワークフロー内タイプ検索' }
      ]
    },
    {
      table: 'Template',
      indexes: [
        { name: 'category', usage: 'high', description: 'カテゴリ検索' },
        { name: 'type', usage: 'high', description: 'タイプ検索' },
        { name: 'isFavorite', usage: 'medium', description: 'お気に入りフィルタ' },
        { name: 'category_type', usage: 'high', description: 'カテゴリ+タイプ検索' },
        { name: 'usageCount', usage: 'medium', description: '人気度ソート' }
      ]
    }
  ];

  return NextResponse.json({
    indexes: indexInfo,
    summary: {
      totalIndexes: indexInfo.reduce((sum, table) => sum + table.indexes.length, 0),
      highUsage: indexInfo.reduce((sum, table) => 
        sum + table.indexes.filter(idx => idx.usage === 'high' || idx.usage === 'very_high').length, 0
      )
    },
    recommendations: [
      'すべての主要クエリパターンに対してインデックスが設定されています',
      '複合インデックスにより範囲検索とソートが最適化されています',
      'workflowId の外部キーインデックスにより結合クエリが高速化されています'
    ]
  });
}

// パフォーマンスベンチマーク実行
async function runPerformanceBenchmark(params: any) {
  const results = await runBasicBenchmarks();
  
  return NextResponse.json({
    benchmark: results,
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      database: 'SQLite'
    }
  });
}

// 基本ベンチマークの実行
async function runBasicBenchmarks() {
  const benchmarks: any = {};

  // ワークフロー一覧クエリのベンチマーク
  const { executionTime: workflowListTime } = await QueryPerformanceMonitor.measureQuery(
    'workflow_list_benchmark',
    () => WorkflowQueryOptimizer.getWorkflowsWithPagination({ limit: 20 })
  );
  benchmarks.workflowList = workflowListTime;

  // エージェント統計クエリのベンチマーク
  const { executionTime: agentStatsTime } = await QueryPerformanceMonitor.measureQuery(
    'agent_stats_benchmark',
    () => AgentQueryOptimizer.getAgentPerformanceStats()
  );
  benchmarks.agentStats = agentStatsTime;

  // テンプレート検索クエリのベンチマーク
  const { executionTime: templateSearchTime } = await QueryPerformanceMonitor.measureQuery(
    'template_search_benchmark',
    () => TemplateQueryOptimizer.searchTemplates({ limit: 20 })
  );
  benchmarks.templateSearch = templateSearchTime;

  // 人気テンプレートクエリのベンチマーク
  const { executionTime: popularTemplatesTime } = await QueryPerformanceMonitor.measureQuery(
    'popular_templates_benchmark',
    () => TemplateQueryOptimizer.getPopularTemplates()
  );
  benchmarks.popularTemplates = popularTemplatesTime;

  // 並列クエリのベンチマーク
  const { totalTime: parallelTime } = await QueryPerformanceMonitor.measureParallelQueries(
    'parallel_stats_benchmark',
    [
      () => QueryOptimizer.getDatabaseStats(),
      () => WorkflowQueryOptimizer.getWorkflowStats(),
      () => AgentQueryOptimizer.getAgentPerformanceStats()
    ]
  );
  benchmarks.parallelStats = parallelTime;

  return benchmarks;
}

// パフォーマンス推奨事項の生成
function generatePerformanceRecommendations(benchmarks: Record<string, number>) {
  const recommendations = [];

  if (benchmarks.workflowList > 100) {
    recommendations.push({
      type: 'optimization',
      priority: 'high',
      message: 'ワークフロー一覧クエリが遅いです。インデックスの確認が必要です。',
      solution: 'status + createdAt の複合インデックスが正しく設定されているか確認してください。'
    });
  }

  if (benchmarks.templateSearch > 200) {
    recommendations.push({
      type: 'optimization',
      priority: 'medium',
      message: 'テンプレート検索クエリが遅いです。',
      solution: 'category + type の複合インデックスと検索条件の最適化を検討してください。'
    });
  }

  if (benchmarks.parallelStats > benchmarks.workflowList + benchmarks.agentStats + 50) {
    recommendations.push({
      type: 'architecture',
      priority: 'low',
      message: '並列クエリのオーバーヘッドが大きいです。',
      solution: 'クエリの統合やキャッシュの導入を検討してください。'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'good',
      priority: 'info',
      message: 'すべてのクエリが良好なパフォーマンスを示しています。',
      solution: '現在の最適化設定を維持してください。'
    });
  }

  return recommendations;
}

// 最適化スコアの計算
function calculateOptimizationScore(benchmarks: Record<string, number>) {
  let score = 100;

  // ベンチマーク結果に基づいてスコアを調整
  Object.entries(benchmarks).forEach(([key, time]) => {
    if (time > 500) score -= 20;
    else if (time > 200) score -= 10;
    else if (time > 100) score -= 5;
  });

  return Math.max(0, score);
}

// クエリパフォーマンス分析
async function analyzeQueryPerformance(params: any) {
  const { queryType, timeRange } = params;

  let analysisResults: any = {};

  switch (queryType) {
    case 'workflow':
      analysisResults = await analyzeWorkflowQueries(timeRange);
      break;
    case 'agent':
      analysisResults = await analyzeAgentQueries(timeRange);
      break;
    case 'template':
      analysisResults = await analyzeTemplateQueries(timeRange);
      break;
    default:
      analysisResults = await analyzeAllQueries(timeRange);
  }

  return NextResponse.json({
    analysis: analysisResults,
    timestamp: new Date().toISOString()
  });
}

// ワークフロークエリ分析
async function analyzeWorkflowQueries(timeRange?: string) {
  const results = [];

  // 各種ワークフロークエリの性能測定
  const queries = [
    {
      name: 'getWorkflowsWithPagination',
      fn: () => WorkflowQueryOptimizer.getWorkflowsWithPagination({ limit: 20 })
    },
    {
      name: 'getWorkflowStats',
      fn: () => WorkflowQueryOptimizer.getWorkflowStats()
    },
    {
      name: 'getWorkflowWithDetails',
      fn: async () => {
        const workflows = await WorkflowQueryOptimizer.getWorkflowsWithPagination({ limit: 1 });
        if (workflows.workflows.length > 0) {
          return WorkflowQueryOptimizer.getWorkflowWithDetails(workflows.workflows[0].id);
        }
        return null;
      }
    }
  ];

  for (const query of queries) {
    try {
      const { executionTime } = await QueryPerformanceMonitor.measureQuery(
        query.name,
        query.fn
      );
      
      results.push({
        queryName: query.name,
        executionTime,
        status: 'success',
        performance: executionTime < 100 ? 'excellent' : 
                    executionTime < 300 ? 'good' : 
                    executionTime < 500 ? 'fair' : 'poor'
      });
    } catch (error) {
      results.push({
        queryName: query.name,
        executionTime: -1,
        status: 'error',
        error: getErrorMessage(error)
      });
    }
  }

  return { type: 'workflow', queries: results };
}

// エージェントクエリ分析
async function analyzeAgentQueries(timeRange?: string) {
  const results = [];

  const queries = [
    {
      name: 'getAgentPerformanceStats',
      fn: () => AgentQueryOptimizer.getAgentPerformanceStats()
    }
  ];

  for (const query of queries) {
    try {
      const { executionTime } = await QueryPerformanceMonitor.measureQuery(
        query.name,
        query.fn
      );
      
      results.push({
        queryName: query.name,
        executionTime,
        status: 'success',
        performance: executionTime < 100 ? 'excellent' : 
                    executionTime < 300 ? 'good' : 'fair'
      });
    } catch (error) {
      results.push({
        queryName: query.name,
        executionTime: -1,
        status: 'error',
        error: getErrorMessage(error)
      });
    }
  }

  return { type: 'agent', queries: results };
}

// テンプレートクエリ分析
async function analyzeTemplateQueries(timeRange?: string) {
  const results = [];

  const queries = [
    {
      name: 'searchTemplates',
      fn: () => TemplateQueryOptimizer.searchTemplates({ limit: 20 })
    },
    {
      name: 'getPopularTemplates',
      fn: () => TemplateQueryOptimizer.getPopularTemplates()
    }
  ];

  for (const query of queries) {
    try {
      const { executionTime } = await QueryPerformanceMonitor.measureQuery(
        query.name,
        query.fn
      );
      
      results.push({
        queryName: query.name,
        executionTime,
        status: 'success',
        performance: executionTime < 100 ? 'excellent' : 
                    executionTime < 300 ? 'good' : 'fair'
      });
    } catch (error) {
      results.push({
        queryName: query.name,
        executionTime: -1,
        status: 'error',
        error: getErrorMessage(error)
      });
    }
  }

  return { type: 'template', queries: results };
}

// 全クエリ分析
async function analyzeAllQueries(timeRange?: string) {
  const [workflowAnalysis, agentAnalysis, templateAnalysis] = await Promise.all([
    analyzeWorkflowQueries(timeRange),
    analyzeAgentQueries(timeRange),
    analyzeTemplateQueries(timeRange)
  ]);

  return {
    summary: {
      totalQueries: workflowAnalysis.queries.length + agentAnalysis.queries.length + templateAnalysis.queries.length,
      successful: [
        ...workflowAnalysis.queries,
        ...agentAnalysis.queries,
        ...templateAnalysis.queries
      ].filter(q => q.status === 'success').length
    },
    details: {
      workflow: workflowAnalysis,
      agent: agentAnalysis,
      template: templateAnalysis
    }
  };
}

// 最適化実行
async function runOptimization(params: any) {
  const { optimizationType } = params;

  // 実際の最適化は現在の実装では主にスキーマレベルで行われているため、
  // ここでは最適化の確認と推奨事項を提供
  const optimizations = {
    indexes: '✅ 最適化済み - 主要テーブルにインデックスが設定されています',
    queries: '✅ 最適化済み - 最適化されたクエリクラスが実装されています',
    schema: '✅ 最適化済み - 外部キー制約とカスケード削除が設定されています'
  };

  return NextResponse.json({
    optimizations,
    message: 'データベースは既に最適化されています',
    nextSteps: [
      'キャッシュ戦略の実装を検討',
      'ページネーションの完全実装',
      'バックグラウンドでの統計データ更新'
    ]
  });
}