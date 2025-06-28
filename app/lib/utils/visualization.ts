// 可視化用データ変換ユーティリティ

import {
  AgentType,
  MarketResearchOutput,
  ContentScrapingOutput,
  NLPClassificationOutput,
  TemplateOptimizationOutput,
  BusinessStrategyOutput,
  ContentCreationOutput,
  CopyGenerationOutput,
  OptimizationArchiveOutput,
  VisualizationData,
  DashboardData,
  WorkflowStatus,
  AgentResponse
} from '../api/types';

// 市場調査データの変換
export function transformMarketResearchData(data: MarketResearchOutput): VisualizationData['marketResearch'] {
  return {
    genres: data.recommended_genres.map(genre => ({
      name: genre.genre,
      trendScore: genre.trend_score,
      profitabilityScore: genre.profitability_score,
      competitionLevel: genre.competition_level,
      marketSize: genre.market_size
    })),
    summary: data.analysis_summary
  };
}

// コンテンツ分析データの変換
export function transformContentAnalysisData(
  scrapingData: ContentScrapingOutput,
  nlpData: NLPClassificationOutput
): VisualizationData['contentAnalysis'] {
  // プラットフォーム別統計
  const platformStats = scrapingData.trending_phrases.reduce((acc, phrase) => {
    const existing = acc.find(p => p.platform === phrase.platform);
    if (existing) {
      existing.count++;
      existing.avgEngagement = (existing.avgEngagement + phrase.engagement_rate) / 2;
    } else {
      acc.push({
        platform: phrase.platform,
        count: 1,
        avgEngagement: phrase.engagement_rate
      });
    }
    return acc;
  }, [] as Array<{ platform: string; count: number; avgEngagement: number }>);

  // 感情分布
  const emotionCounts = { positive: 0, negative: 0, neutral: 0 };
  Object.values(nlpData.classified_data.by_emotion).forEach(emotions => {
    emotions.forEach(() => {
      // 感情タイプを判定してカウント
    });
  });

  const emotionDistribution = Object.entries(emotionCounts).map(([emotion, count]) => ({
    emotion,
    count,
    percentage: (count / nlpData.classification_stats.total_classified) * 100
  }));

  // 構造パターン
  const structurePatterns = Object.entries(nlpData.classified_data.by_structure).map(([pattern, items]) => ({
    pattern,
    successRate: items.reduce((sum, item) => sum + item.effectiveness_score, 0) / items.length,
    usage: items.length
  }));

  return {
    platformStats,
    emotionDistribution,
    structurePatterns
  };
}

// テンプレート最適化データの変換
export function transformTemplateOptimizationData(data: TemplateOptimizationOutput): VisualizationData['templateOptimization'] {
  const templates = data.optimized_templates.map(template => ({
    id: template.template_id,
    name: template.template_name,
    successRate: template.success_rate,
    engagementRate: template.metrics.engagement_rate,
    conversionRate: template.metrics.conversion_rate
  }));

  // 上位3つのテンプレートの比較データ
  const topTemplates = templates.slice(0, 3);
  const comparison = [
    {
      metric: 'Success Rate',
      template1: topTemplates[0]?.successRate || 0,
      template2: topTemplates[1]?.successRate || 0,
      template3: topTemplates[2]?.successRate || 0
    },
    {
      metric: 'Engagement Rate',
      template1: topTemplates[0]?.engagementRate || 0,
      template2: topTemplates[1]?.engagementRate || 0,
      template3: topTemplates[2]?.engagementRate || 0
    },
    {
      metric: 'Conversion Rate',
      template1: topTemplates[0]?.conversionRate || 0,
      template2: topTemplates[1]?.conversionRate || 0,
      template3: topTemplates[2]?.conversionRate || 0
    }
  ];

  return {
    templates,
    comparison
  };
}

// ビジネス戦略データの変換
export function transformBusinessStrategyData(data: BusinessStrategyOutput): VisualizationData['businessStrategy'] {
  const productLineup = [
    {
      name: data.product_lineup.frontend.name,
      price: data.product_lineup.frontend.price,
      profitMargin: data.product_lineup.frontend.profit_margin
    },
    {
      name: data.product_lineup.middle.name,
      price: data.product_lineup.middle.price,
      profitMargin: data.product_lineup.middle.profit_margin
    },
    {
      name: data.product_lineup.backend.name,
      price: data.product_lineup.backend.price,
      profitMargin: data.product_lineup.backend.profit_margin
    }
  ];

  const conversionRates = [
    { stage: 'Frontend', rate: data.roi_projection.conversion_rates.frontend },
    { stage: 'Middle', rate: data.roi_projection.conversion_rates.middle },
    { stage: 'Backend', rate: data.roi_projection.conversion_rates.backend }
  ];

  const revenueBreakdown = [
    { category: 'Revenue', amount: data.roi_projection.monthly_revenue },
    { category: 'Advertising', amount: data.roi_projection.cost_structure.advertising },
    { category: 'Content Creation', amount: data.roi_projection.cost_structure.content_creation },
    { category: 'Tools & Systems', amount: data.roi_projection.cost_structure.tools_and_systems },
    { category: 'Net Profit', amount: data.roi_projection.net_profit }
  ];

  return {
    productLineup,
    roiProjection: {
      monthlyTargetLeads: data.roi_projection.monthly_target_leads,
      conversionRates,
      revenueBreakdown
    }
  };
}

// コンテンツ作成データの変換
export function transformContentCreationData(data: ContentCreationOutput): VisualizationData['contentCreation'] {
  const contentTypes = [
    {
      type: 'Landing Page',
      count: 1,
      avgLength: data.landing_page.sections.reduce((sum, section) => sum + section.content.length, 0) / data.landing_page.sections.length
    },
    {
      type: 'Email Sequence',
      count: data.email_sequence.length,
      avgLength: data.email_sequence.reduce((sum, email) => sum + email.content.length, 0) / data.email_sequence.length
    }
  ];

  const platformDistribution = [
    {
      platform: 'Twitter',
      posts: data.sns_content.twitter.length
    },
    {
      platform: 'Instagram',
      posts: data.sns_content.instagram.length
    }
  ];

  return {
    contentTypes,
    platformDistribution
  };
}

// コピー生成データの変換
export function transformCopyGenerationData(data: CopyGenerationOutput): VisualizationData['copyGeneration'] {
  const hookCategories = [
    {
      category: 'Aggressive',
      count: data.aggressive_hooks.length,
      avgCtr: data.aggressive_hooks.reduce((sum, hook) => sum + hook.expected_ctr, 0) / data.aggressive_hooks.length
    },
    {
      category: 'Empathy',
      count: data.empathy_hooks.length,
      avgCtr: data.empathy_hooks.reduce((sum, hook) => sum + hook.expected_ctr, 0) / data.empathy_hooks.length
    },
    {
      category: 'Contrarian',
      count: data.contrarian_hooks.length,
      avgCtr: data.contrarian_hooks.reduce((sum, hook) => sum + hook.expected_ctr, 0) / data.contrarian_hooks.length
    }
  ];

  const performance = hookCategories.map(category => ({
    category: category.category,
    expectedCtr: category.avgCtr,
    actualCtr: undefined // 実測値は後で追加
  }));

  return {
    hookCategories,
    performance
  };
}

// エージェントデータの統合変換
export function transformAgentDataToVisualization(agents: AgentResponse[]): VisualizationData {
  const visualization: VisualizationData = {};

  agents.forEach(agent => {
    if (!agent.output) return;

    try {
      const outputData = typeof agent.output === 'string' ? JSON.parse(agent.output) : agent.output;

      switch (agent.type) {
        case AgentType.MARKET_RESEARCH:
          visualization.marketResearch = transformMarketResearchData(outputData);
          break;
        case AgentType.CONTENT_SCRAPING:
          // NLP分類データと組み合わせる必要があるため、後で処理
          break;
        case AgentType.NLP_CLASSIFICATION:
          // コンテンツスクレイピングデータと組み合わせて処理
          const scrapingAgent = agents.find(a => a.type === AgentType.CONTENT_SCRAPING);
          if (scrapingAgent && scrapingAgent.output) {
            const scrapingData = typeof scrapingAgent.output === 'string' ? JSON.parse(scrapingAgent.output) : scrapingAgent.output;
            visualization.contentAnalysis = transformContentAnalysisData(scrapingData, outputData);
          }
          break;
        case AgentType.TEMPLATE_OPTIMIZATION:
          visualization.templateOptimization = transformTemplateOptimizationData(outputData);
          break;
        case AgentType.BUSINESS_STRATEGY:
          visualization.businessStrategy = transformBusinessStrategyData(outputData);
          break;
        case AgentType.CONTENT_CREATION:
          visualization.contentCreation = transformContentCreationData(outputData);
          break;
        case AgentType.COPY_GENERATION:
          visualization.copyGeneration = transformCopyGenerationData(outputData);
          break;
      }
    } catch (error) {
      console.error(`Failed to transform data for agent ${agent.type}:`, error);
    }
  });

  return visualization;
}

// ダッシュボードデータの作成
export function createDashboardData(
  workflowId: string,
  workflowName: string,
  status: WorkflowStatus,
  agents: AgentResponse[],
  completedAt?: string
): DashboardData {
  const visualization = transformAgentDataToVisualization(agents);
  
  const completedAgents = agents.filter(agent => agent.status === WorkflowStatus.COMPLETED).length;
  const totalAgents = agents.length;
  
  // 処理時間の計算（最初のエージェント開始から最後のエージェント完了まで）
  const startTimes = agents.map(agent => new Date(agent.createdAt).getTime()).filter(Boolean);
  const endTimes = agents.map(agent => agent.completedAt ? new Date(agent.completedAt).getTime() : null).filter((time): time is number => time !== null);
  const processingTime = endTimes.length > 0 && startTimes.length > 0 
    ? Math.max(...endTimes) - Math.min(...startTimes) 
    : 0;

  // エクスポート用データの準備
  const exportData = {
    templates: agents
      .filter(agent => agent.type === AgentType.TEMPLATE_OPTIMIZATION && agent.output)
      .map(agent => {
        try {
          return typeof agent.output === 'string' ? JSON.parse(agent.output) : agent.output;
        } catch {
          return null;
        }
      })
      .filter(Boolean),
    content: agents
      .filter(agent => agent.type === AgentType.CONTENT_CREATION && agent.output)
      .map(agent => {
        try {
          return typeof agent.output === 'string' ? JSON.parse(agent.output) : agent.output;
        } catch {
          return null;
        }
      })
      .filter(Boolean),
    analytics: agents
      .filter(agent => agent.output)
      .map(agent => ({
        type: agent.type,
        data: (() => {
          try {
            return typeof agent.output === 'string' ? JSON.parse(agent.output) : agent.output;
          } catch {
            return null;
          }
        })()
      }))
      .filter(item => item.data !== null)
  };

  return {
    workflowId,
    workflowName,
    status,
    completedAt,
    visualization,
    summary: {
      totalAgents,
      completedAgents,
      processingTime,
      successRate: totalAgents > 0 ? (completedAgents / totalAgents) * 100 : 0
    },
    exportData
  };
}

// データのエクスポート用ユーティリティ
export function exportDataAsJSON(data: any, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// データのCSVエクスポート用ユーティリティ
export function exportDataAsCSV(data: any[], filename: string): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // CSVエスケープ処理
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}