// Workflow Export API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/utils/db';
import { getErrorMessage } from '@/lib/utils';

// GET /api/workflows/[id]/export - ワークフロー結果エクスポート
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // ワークフロー詳細データを取得
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        agents: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            type: true,
            status: true,
            createdAt: true,
            completedAt: true,
            output: true,
            error: true,
          }
        },
        results: {
          select: {
            id: true,
            agentResults: true,
            processedOutput: true,
            analysisData: true,
          }
        }
      }
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // データの準備
    const exportData = {
      workflow: {
        id: workflow.id,
        name: workflow.name,
        status: workflow.status,
        createdAt: workflow.createdAt,
        completedAt: workflow.completedAt,
      },
      agents: workflow.agents.map(agent => ({
        id: agent.id,
        type: agent.type,
        status: agent.status,
        startedAt: agent.createdAt,
        completedAt: agent.completedAt,
        executionTime: agent.completedAt 
          ? Math.round((new Date(agent.completedAt).getTime() - new Date(agent.createdAt).getTime()) / 1000)
          : null,
        output: agent.output ? (() => {
          try {
            return JSON.parse(agent.output);
          } catch {
            return agent.output;
          }
        })() : null,
        error: agent.error,
      })),
      results: workflow.results,
      exportedAt: new Date().toISOString(),
    };

    switch (format.toLowerCase()) {
      case 'json':
        return new NextResponse(JSON.stringify(exportData, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="workflow-${workflowId}-results.json"`,
          },
        });

      case 'csv':
        // CSVフォーマット用にデータを平坦化
        const csvRows = [];
        
        // ヘッダー行
        csvRows.push([
          'Agent ID',
          'Agent Type',
          'Status',
          'Started At',
          'Completed At',
          'Execution Time (s)',
          'Has Output',
          'Error'
        ].join(','));

        // データ行
        exportData.agents.forEach(agent => {
          csvRows.push([
            agent.id,
            agent.type,
            agent.status,
            agent.startedAt,
            agent.completedAt || '',
            agent.executionTime || '',
            agent.output ? 'Yes' : 'No',
            agent.error || ''
          ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
        });

        const csvContent = csvRows.join('\n');

        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="workflow-${workflowId}-results.csv"`,
          },
        });

      case 'pdf':
        // PDFは簡単なHTML形式でレポート生成
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>ワークフロー結果レポート</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1, h2 { color: #333; }
              table { border-collapse: collapse; width: 100%; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .status-completed { color: green; font-weight: bold; }
              .status-failed { color: red; font-weight: bold; }
              .status-running { color: blue; font-weight: bold; }
              .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <h1>ワークフロー結果レポート</h1>
            
            <div class="summary">
              <h2>概要</h2>
              <p><strong>ワークフロー名:</strong> ${workflow.name}</p>
              <p><strong>ステータス:</strong> <span class="status-${workflow.status}">${workflow.status}</span></p>
              <p><strong>作成日時:</strong> ${new Date(workflow.createdAt).toLocaleString('ja-JP')}</p>
              ${workflow.completedAt ? `<p><strong>完了日時:</strong> ${new Date(workflow.completedAt).toLocaleString('ja-JP')}</p>` : ''}
              <p><strong>エージェント数:</strong> ${exportData.agents.length}</p>
              <p><strong>完了エージェント:</strong> ${exportData.agents.filter(a => a.status === 'completed').length}</p>
            </div>

            <h2>エージェント実行詳細</h2>
            <table>
              <thead>
                <tr>
                  <th>エージェント</th>
                  <th>ステータス</th>
                  <th>開始時刻</th>
                  <th>完了時刻</th>
                  <th>実行時間</th>
                  <th>出力</th>
                </tr>
              </thead>
              <tbody>
                ${exportData.agents.map(agent => `
                  <tr>
                    <td>${agent.type}</td>
                    <td><span class="status-${agent.status}">${agent.status}</span></td>
                    <td>${new Date(agent.startedAt).toLocaleString('ja-JP')}</td>
                    <td>${agent.completedAt ? new Date(agent.completedAt).toLocaleString('ja-JP') : '-'}</td>
                    <td>${agent.executionTime ? `${agent.executionTime}秒` : '-'}</td>
                    <td>${agent.output ? '有り' : '無し'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div style="margin-top: 40px; font-size: 12px; color: #666;">
              <p>エクスポート日時: ${new Date().toLocaleString('ja-JP')}</p>
              <p>生成システム: AI Marketing Agent Platform</p>
            </div>
          </body>
          </html>
        `;

        return new NextResponse(htmlContent, {
          headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': `attachment; filename="workflow-${workflowId}-report.html"`,
          },
        });

      default:
        return NextResponse.json(
          { error: 'Unsupported format. Use: json, csv, or pdf' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}