// ビジネス戦略エージェント

import { BaseAgent, AgentContext } from './base';
import { 
  AgentType, 
  BusinessStrategyOutput, 
  TemplateOptimizationOutput,
  MarketResearchOutput 
} from '../api/types';

export class BusinessStrategyAgent extends BaseAgent {
  constructor() {
    super(AgentType.BUSINESS_STRATEGY);
  }
  
  formatInput(context: AgentContext): string {
    const marketResearch = context.previousOutputs.get(AgentType.MARKET_RESEARCH) as MarketResearchOutput;
    const templateOptimization = context.previousOutputs.get(AgentType.TEMPLATE_OPTIMIZATION) as TemplateOptimizationOutput;
    
    if (!marketResearch || !templateOptimization) {
      throw new Error('Market research and template optimization outputs are required');
    }
    
    const topGenre = marketResearch.recommended_genres[0];
    const templates = templateOptimization.optimized_templates;
    
    let prompt = `以下の情報を基に、最適な商品構成とセールスファネルを設計してください。

ジャンル情報:
- ジャンル: ${topGenre.genre}
- 市場規模: ${topGenre.market_size}
- ターゲット: ${topGenre.target_audience}
- 収益性スコア: ${topGenre.profitability_score}

利用可能なテンプレート数: ${templates.length}

以下を設計してください：
1. 商品構成（フロント・ミドル・バックエンド）
2. セールスファネル（認知〜継続の5段階）
3. ROI予測と収益モデル

出力は以下のJSON形式でお願いします：
{
  "product_lineup": {
    "frontend": {
      "name": "フロント商品名",
      "price": 1980,
      "purpose": "集客・信頼獲得",
      "content": "商品内容詳細",
      "profit_margin": 60
    },
    "middle": {
      "name": "メイン商品名", 
      "price": 19800,
      "purpose": "メイン収益",
      "content": "商品内容詳細",
      "profit_margin": 80
    },
    "backend": {
      "name": "高額商品名",
      "price": 198000,
      "purpose": "高収益・関係深化",
      "content": "商品内容詳細", 
      "profit_margin": 85
    }
  },
  "sales_funnel": {
    "awareness": {
      "channels": ["SNS投稿", "ブログ記事", "YouTube"],
      "content_types": ["お役立ち情報", "成功事例", "業界トレンド"],
      "kpi": "リーチ数・インプレッション"
    },
    "interest": {
      "channels": ["無料eBook", "メルマガ", "セミナー"],
      "content_types": ["詳細ガイド", "限定情報", "個別相談"],
      "kpi": "リード獲得数・エンゲージメント率"
    },
    "consideration": {
      "channels": ["セールスページ", "個別相談", "体験版"],
      "content_types": ["商品詳細", "お客様の声", "よくある質問"],
      "kpi": "コンバージョン率・検討期間"
    },
    "purchase": {
      "channels": ["決済ページ", "電話クロージング"],
      "content_types": ["限定特典", "保証内容", "緊急性"],
      "kpi": "成約率・客単価"
    },
    "retention": {
      "channels": ["会員サイト", "コミュニティ", "個別サポート"],
      "content_types": ["継続サポート", "追加コンテンツ", "アップセル"],
      "kpi": "継続率・LTV"
    }
  },
  "roi_projection": {
    "monthly_target_leads": 100,
    "conversion_rates": {
      "frontend": 15,
      "middle": 8,
      "backend": 3
    },
    "monthly_revenue": 456000,
    "cost_structure": {
      "advertising": 150000,
      "content_creation": 80000,
      "tools_and_systems": 30000
    },
    "net_profit": 196000,
    "roi_percentage": 75.4
  }
}`;
    
    return prompt;
  }
  
  parseOutput(response: string): BusinessStrategyOutput {
    return this.extractJson(response);
  }
  
  validateOutput(output: any): boolean {
    if (!output || typeof output !== 'object') return false;
    
    // product_lineupの検証
    if (!output.product_lineup || typeof output.product_lineup !== 'object') return false;
    const products = ['frontend', 'middle', 'backend'];
    for (const product of products) {
      const p = output.product_lineup[product];
      if (!p || typeof p !== 'object') return false;
      if (!p.name || typeof p.name !== 'string') return false;
      if (typeof p.price !== 'number') return false;
      if (!p.purpose || typeof p.purpose !== 'string') return false;
      if (!p.content || typeof p.content !== 'string') return false;
      if (typeof p.profit_margin !== 'number') return false;
    }
    
    // sales_funnelの検証
    if (!output.sales_funnel || typeof output.sales_funnel !== 'object') return false;
    const stages = ['awareness', 'interest', 'consideration', 'purchase', 'retention'];
    for (const stage of stages) {
      const s = output.sales_funnel[stage];
      if (!s || typeof s !== 'object') return false;
      if (!Array.isArray(s.channels)) return false;
      if (!Array.isArray(s.content_types)) return false;
      if (!s.kpi || typeof s.kpi !== 'string') return false;
    }
    
    // roi_projectionの検証
    if (!output.roi_projection || typeof output.roi_projection !== 'object') return false;
    const roi = output.roi_projection;
    if (typeof roi.monthly_target_leads !== 'number') return false;
    if (!roi.conversion_rates || typeof roi.conversion_rates !== 'object') return false;
    if (typeof roi.monthly_revenue !== 'number') return false;
    if (!roi.cost_structure || typeof roi.cost_structure !== 'object') return false;
    if (typeof roi.net_profit !== 'number') return false;
    if (typeof roi.roi_percentage !== 'number') return false;
    
    return true;
  }
}
