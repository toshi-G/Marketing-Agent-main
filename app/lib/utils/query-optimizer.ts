// Database Query Optimization Utilities

import prisma from '@/lib/utils/db';

/**
 * 最適化されたワークフロークエリ
 */
export class WorkflowQueryOptimizer {
  
  // ワークフロー一覧の効率的な取得
  static async getWorkflowsWithPagination({
    status,
    limit = 20,
    offset = 0,
    orderBy = 'createdAt',
    orderDirection = 'desc'
  }: {
    status?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'updatedAt' | 'completedAt' | 'name';
    orderDirection?: 'asc' | 'desc';
  }) {
    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }

    // インデックスを活用したクエリ
    const [workflows, totalCount] = await Promise.all([
      prisma.workflow.findMany({
        where: whereClause,
        include: {
          agents: {
            select: {
              id: true,
              type: true,
              status: true,
              completedAt: true,
              createdAt: true
            },
            orderBy: { createdAt: 'asc' }
          },
          results: {
            select: {
              id: true,
              status: true,
              createdAt: true
            },
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { [orderBy]: orderDirection },
        take: limit,
        skip: offset
      }),
      
      // 総数カウント（インデックス使用）
      prisma.workflow.count({
        where: whereClause
      })
    ]);

    return {
      workflows,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Math.floor(offset / limit) + 1
      }
    };
  }

  // 特定ワークフローの詳細取得（関連データ含む）
  static async getWorkflowWithDetails(workflowId: string) {
    return await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        agents: {
          orderBy: { createdAt: 'asc' }
        },
        results: {
          orderBy: { createdAt: 'desc' },
          take: 10 // 最新10件のみ
        }
      }
    });
  }

  // ステータス別統計の効率的な取得
  static async getWorkflowStats(dateRange?: { start: Date; end: Date }) {
    const whereClause: any = {};
    
    if (dateRange) {
      whereClause.createdAt = {
        gte: dateRange.start,
        lte: dateRange.end
      };
    }

    // 複数の集計クエリを並列実行
    const [
      totalCount,
      statusCounts,
      completionStats,
      recentActivity
    ] = await Promise.all([
      // 総数
      prisma.workflow.count({ where: whereClause }),
      
      // ステータス別カウント（status インデックス使用）
      prisma.workflow.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { _all: true }
      }),
      
      // 完了時間統計
      prisma.workflow.aggregate({
        where: {
          ...whereClause,
          status: 'completed',
          completedAt: { not: null }
        },
        _avg: {
          completedAt: true
        },
        _count: {
          _all: true
        }
      }),
      
      // 最近のアクティビティ（createdAt インデックス使用）
      prisma.workflow.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    return {
      total: totalCount,
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count._all;
        return acc;
      }, {} as Record<string, number>),
      completion: completionStats,
      recentActivity
    };
  }
}

/**
 * 最適化されたエージェントクエリ
 */
export class AgentQueryOptimizer {
  
  // ワークフロー内エージェントの効率的な取得
  static async getAgentsByWorkflow(workflowId: string) {
    // workflowId インデックスを使用
    return await prisma.agent.findMany({
      where: { workflowId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        type: true,
        status: true,
        input: true,
        output: true,
        error: true,
        metadata: true,
        createdAt: true,
        completedAt: true
      }
    });
  }

  // エージェントタイプ別パフォーマンス統計
  static async getAgentPerformanceStats(dateRange?: { start: Date; end: Date }) {
    const whereClause: any = {};
    
    if (dateRange) {
      whereClause.createdAt = {
        gte: dateRange.start,
        lte: dateRange.end
      };
    }

    // type と status の複合インデックスを使用
    const stats = await prisma.agent.groupBy({
      by: ['type', 'status'],
      where: whereClause,
      _count: { _all: true },
      _avg: {
        completedAt: true
      }
    });

    // データを整形
    const result = stats.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = {
          total: 0,
          completed: 0,
          failed: 0,
          pending: 0,
          running: 0
        };
      }
      
      acc[item.type][item.status as keyof typeof acc[string]] = item._count._all;
      acc[item.type].total += item._count._all;
      
      return acc;
    }, {} as Record<string, any>);

    return result;
  }
}

/**
 * 最適化されたテンプレートクエリ
 */
export class TemplateQueryOptimizer {
  
  // フィルタリング付きテンプレート検索
  static async searchTemplates({
    category,
    type,
    isFavorite,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    limit = 20,
    offset = 0
  }: {
    category?: string;
    type?: string;
    isFavorite?: boolean;
    search?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsedAt' | 'name';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }) {
    const whereClause: any = {};
    
    // インデックスを活用したフィルタリング
    if (category) whereClause.category = category;
    if (type) whereClause.type = type;
    if (isFavorite !== undefined) whereClause.isFavorite = isFavorite;
    
    // テキスト検索（パフォーマンス考慮で制限）
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [templates, totalCount] = await Promise.all([
      prisma.template.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset
      }),
      
      prisma.template.count({
        where: whereClause
      })
    ]);

    return {
      templates,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Math.floor(offset / limit) + 1
      }
    };
  }

  // 人気テンプレートの取得
  static async getPopularTemplates(limit = 10) {
    // usageCount インデックスを使用
    return await prisma.template.findMany({
      where: {
        usageCount: { gt: 0 }
      },
      orderBy: [
        { usageCount: 'desc' },
        { lastUsedAt: 'desc' }
      ],
      take: limit,
      select: {
        id: true,
        name: true,
        category: true,
        type: true,
        usageCount: true,
        lastUsedAt: true,
        performance: true
      }
    });
  }

  // テンプレート使用回数の更新
  static async incrementUsage(templateId: string) {
    return await prisma.template.update({
      where: { id: templateId },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date()
      }
    });
  }
}

/**
 * 最適化されたコンテンツクエリ
 */
export class ContentQueryOptimizer {
  
  // プラットフォーム別コンテンツ取得
  static async getContentByPlatform(platform: string, limit = 20) {
    // type と platform の複合インデックスを使用
    return await prisma.content.findMany({
      where: { platform },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
        performance: true,
        createdAt: true
      }
    });
  }

  // コンテンツタイプ別統計
  static async getContentTypeStats() {
    return await prisma.content.groupBy({
      by: ['type', 'platform'],
      _count: { _all: true },
      orderBy: {
        _count: {
          _all: 'desc'
        }
      }
    });
  }
}

/**
 * 汎用クエリ最適化ユーティリティ
 */
export class QueryOptimizer {
  
  // バッチ処理での効率的なデータ取得
  static async batchGetWorkflowsWithAgents(workflowIds: string[]) {
    if (workflowIds.length === 0) return [];
    
    // IN クエリを使用してバッチ取得
    return await prisma.workflow.findMany({
      where: {
        id: { in: workflowIds }
      },
      include: {
        agents: {
          select: {
            id: true,
            type: true,
            status: true,
            completedAt: true
          }
        }
      }
    });
  }

  // 複数テーブルの関連データを効率的に取得
  static async getWorkflowSummary(workflowId: string) {
    const [workflow, agentCount, resultCount] = await Promise.all([
      prisma.workflow.findUnique({
        where: { id: workflowId },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          completedAt: true
        }
      }),
      
      prisma.agent.count({
        where: { workflowId }
      }),
      
      prisma.workflowResult.count({
        where: { workflowId }
      })
    ]);

    return {
      workflow,
      agentCount,
      resultCount
    };
  }

  // データベース統計情報の取得
  static async getDatabaseStats() {
    const [
      workflowCount,
      agentCount,
      templateCount,
      contentCount,
      resultCount
    ] = await Promise.all([
      prisma.workflow.count(),
      prisma.agent.count(),
      prisma.template.count(),
      prisma.content.count(),
      prisma.workflowResult.count()
    ]);

    return {
      workflows: workflowCount,
      agents: agentCount,
      templates: templateCount,
      content: contentCount,
      results: resultCount,
      total: workflowCount + agentCount + templateCount + contentCount + resultCount
    };
  }
}

/**
 * クエリパフォーマンス監視
 */
export class QueryPerformanceMonitor {
  
  // クエリ実行時間の測定
  static async measureQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<{ result: T; executionTime: number }> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const executionTime = Date.now() - startTime;
      
      // 実行時間をログ出力（開発環境のみ）
      if (process.env.NODE_ENV === 'development') {
        console.log(`Query [${queryName}] executed in ${executionTime}ms`);
        
        // 長時間実行クエリを警告
        if (executionTime > 1000) {
          console.warn(`Slow query detected: ${queryName} took ${executionTime}ms`);
        }
      }
      
      return { result, executionTime };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`Query [${queryName}] failed after ${executionTime}ms:`, error);
      throw error;
    }
  }

  // 複数クエリの並列実行監視
  static async measureParallelQueries<T extends readonly unknown[]>(
    queryName: string,
    queries: readonly [...{ [K in keyof T]: () => Promise<T[K]> }]
  ): Promise<{ results: T; totalTime: number; individualTimes: number[] }> {
    const startTime = Date.now();
    const individualStartTimes = queries.map(() => Date.now());
    
    try {
      const results = await Promise.all(
        queries.map(async (query, index) => {
          const result = await query();
          const individualTime = Date.now() - individualStartTimes[index];
          return result;
        })
      ) as T;
      
      const totalTime = Date.now() - startTime;
      const individualTimes = queries.map((_, index) => Date.now() - individualStartTimes[index]);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Parallel queries [${queryName}] completed in ${totalTime}ms`);
        console.log(`Individual times:`, individualTimes);
      }
      
      return { results, totalTime, individualTimes };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`Parallel queries [${queryName}] failed after ${totalTime}ms:`, error);
      throw error;
    }
  }
}