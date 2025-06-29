// Performance Analytics Export API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/utils/db';
import { getErrorMessage } from '@/lib/utils';

// GET /api/analytics/performance/export - パフォーマンスデータエクスポート
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const format = searchParams.get('format') || 'csv';

    // 日付範囲の計算
    const now = new Date();
    const daysBack = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // データ取得
    const [workflows, agents, templates] = await Promise.all([
      prisma.workflow.findMany({
        where: {
          createdAt: { gte: startDate }
        },
        include: {
          agents: {
            select: {
              id: true,
              type: true,
              status: true,
              createdAt: true,
              completedAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      prisma.agent.findMany({
        where: {
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          type: true,
          status: true,
          createdAt: true,
          completedAt: true
        }
      }),

      prisma.template.findMany({
        select: {
          id: true,
          name: true,
          category: true,
          performance: true,
          createdAt: true
        }
      })
    ]);

    // 統計計算
    const totalWorkflows = workflows.length;
    const completedWorkflows = workflows.filter(w => w.status === 'completed').length;
    const successRate = totalWorkflows > 0 ? (completedWorkflows / totalWorkflows) * 100 : 0;

    // 実行時間計算
    const executionTimes = workflows
      .filter(w => w.status === 'completed' && w.completedAt)
      .map(w => {
        const start = new Date(w.createdAt).getTime();
        const end = new Date(w.completedAt!).getTime();
        return (end - start) / 1000;
      });

    const avgExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
      : 0;

    // エージェント統計
    const agentStats = agents.reduce((acc, agent) => {
      const type = agent.type || 'unknown';
      if (!acc[type]) {
        acc[type] = { total: 0, completed: 0, failed: 0 };
      }
      acc[type].total++;
      if (agent.status === 'completed') acc[type].completed++;
      if (agent.status === 'failed') acc[type].failed++;
      return acc;
    }, {} as Record<string, { total: number; completed: number; failed: number }>);

    switch (format.toLowerCase()) {
      case 'csv':
        // CSV形式でエクスポート
        const csvData = generateCSVReport(workflows, agents, agentStats, {
          totalWorkflows,
          successRate,
          avgExecutionTime
        });

        return new NextResponse(csvData, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="performance-analytics-${range}-${now.toISOString().split('T')[0]}.csv"`,
          },
        });

      case 'json':
        // JSON形式でエクスポート
        const jsonData = {
          summary: {
            totalWorkflows,
            completedWorkflows,
            successRate,
            avgExecutionTime,
            exportDate: now.toISOString(),
            dateRange: range
          },
          workflows: workflows.map(w => ({
            id: w.id,
            name: w.name,
            status: w.status,
            createdAt: w.createdAt,
            completedAt: w.completedAt,
            agentCount: w.agents.length,
            completedAgents: w.agents.filter(a => a.status === 'completed').length
          })),
          agentStats,
          templates: templates.map(t => ({
            id: t.id,
            name: t.name,
            category: t.category,
            performance: t.performance ? JSON.parse(t.performance) : null,
            createdAt: t.createdAt
          }))
        };

        return new NextResponse(JSON.stringify(jsonData, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="performance-analytics-${range}-${now.toISOString().split('T')[0]}.json"`,
          },
        });

      case 'xlsx':
        // Excel形式（簡易版HTML）
        const excelData = generateExcelReport(workflows, agents, agentStats, {
          totalWorkflows,
          successRate,
          avgExecutionTime
        });

        return new NextResponse(excelData, {
          headers: {
            'Content-Type': 'application/vnd.ms-excel',
            'Content-Disposition': `attachment; filename="performance-analytics-${range}-${now.toISOString().split('T')[0]}.xls"`,
          },
        });

      default:
        return NextResponse.json(
          { error: 'Unsupported format. Use: csv, json, or xlsx' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Performance export error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// CSV レポート生成
function generateCSVReport(
  workflows: any[], 
  agents: any[], 
  agentStats: any, 
  summary: any
): string {
  const rows = [];
  
  // ヘッダー
  rows.push('セクション,項目,値,単位,備考');
  
  // サマリー
  rows.push(`サマリー,総ワークフロー数,${summary.totalWorkflows},件,`);
  rows.push(`サマリー,成功率,${summary.successRate.toFixed(1)},％,`);
  rows.push(`サマリー,平均実行時間,${Math.round(summary.avgExecutionTime / 60)},分,`);
  
  // エージェント統計
  Object.entries(agentStats).forEach(([type, stats]: [string, any]) => {
    const successRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
    rows.push(`エージェント統計,${type} - 総数,${stats.total},件,`);
    rows.push(`エージェント統計,${type} - 完了数,${stats.completed},件,`);
    rows.push(`エージェント統計,${type} - 失敗数,${stats.failed},件,`);
    rows.push(`エージェント統計,${type} - 成功率,${successRate.toFixed(1)},％,`);
  });
  
  // 空行
  rows.push('');
  
  // ワークフロー詳細ヘッダー
  rows.push('ワークフロー ID,名前,ステータス,作成日時,完了日時,エージェント数,完了エージェント数,実行時間(秒)');
  
  // ワークフロー詳細データ
  workflows.forEach(workflow => {
    const executionTime = workflow.completedAt 
      ? Math.round((new Date(workflow.completedAt).getTime() - new Date(workflow.createdAt).getTime()) / 1000)
      : '';
    
    const completedAgents = workflow.agents.filter((a: any) => a.status === 'completed').length;
    
    rows.push([
      workflow.id,
      `"${workflow.name}"`,
      workflow.status,
      new Date(workflow.createdAt).toLocaleString('ja-JP'),
      workflow.completedAt ? new Date(workflow.completedAt).toLocaleString('ja-JP') : '',
      workflow.agents.length,
      completedAgents,
      executionTime
    ].join(','));
  });

  return rows.join('\n');
}

// Excel レポート生成（HTML形式）
function generateExcelReport(
  workflows: any[], 
  agents: any[], 
  agentStats: any, 
  summary: any
): string {
  return `
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .summary { background-color: #e8f4fd; }
        .agent-stats { background-color: #f0f8f0; }
      </style>
    </head>
    <body>
      <h1>パフォーマンス分析レポート</h1>
      <p>生成日時: ${new Date().toLocaleString('ja-JP')}</p>
      
      <h2>サマリー</h2>
      <table>
        <tr class="summary">
          <th>項目</th>
          <th>値</th>
          <th>単位</th>
        </tr>
        <tr class="summary">
          <td>総ワークフロー数</td>
          <td>${summary.totalWorkflows}</td>
          <td>件</td>
        </tr>
        <tr class="summary">
          <td>成功率</td>
          <td>${summary.successRate.toFixed(1)}</td>
          <td>%</td>
        </tr>
        <tr class="summary">
          <td>平均実行時間</td>
          <td>${Math.round(summary.avgExecutionTime / 60)}</td>
          <td>分</td>
        </tr>
      </table>
      
      <h2>エージェント統計</h2>
      <table>
        <tr class="agent-stats">
          <th>エージェントタイプ</th>
          <th>総数</th>
          <th>完了数</th>
          <th>失敗数</th>
          <th>成功率</th>
        </tr>
        ${Object.entries(agentStats).map(([type, stats]: [string, any]) => {
          const successRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
          return `
            <tr class="agent-stats">
              <td>${type}</td>
              <td>${stats.total}</td>
              <td>${stats.completed}</td>
              <td>${stats.failed}</td>
              <td>${successRate.toFixed(1)}%</td>
            </tr>
          `;
        }).join('')}
      </table>
      
      <h2>ワークフロー詳細</h2>
      <table>
        <tr>
          <th>ID</th>
          <th>名前</th>
          <th>ステータス</th>
          <th>作成日時</th>
          <th>完了日時</th>
          <th>エージェント数</th>
          <th>完了エージェント数</th>
          <th>実行時間(秒)</th>
        </tr>
        ${workflows.map(workflow => {
          const executionTime = workflow.completedAt 
            ? Math.round((new Date(workflow.completedAt).getTime() - new Date(workflow.createdAt).getTime()) / 1000)
            : '';
          
          const completedAgents = workflow.agents.filter((a: any) => a.status === 'completed').length;
          
          return `
            <tr>
              <td>${workflow.id}</td>
              <td>${workflow.name}</td>
              <td>${workflow.status}</td>
              <td>${new Date(workflow.createdAt).toLocaleString('ja-JP')}</td>
              <td>${workflow.completedAt ? new Date(workflow.completedAt).toLocaleString('ja-JP') : ''}</td>
              <td>${workflow.agents.length}</td>
              <td>${completedAgents}</td>
              <td>${executionTime}</td>
            </tr>
          `;
        }).join('')}
      </table>
    </body>
    </html>
  `;
}