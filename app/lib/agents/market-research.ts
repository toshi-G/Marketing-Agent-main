// 市場調査エージェント

import { BaseAgent, AgentContext } from './base';
import { AgentType, MarketResearchOutput } from '../api/types';

export class MarketResearchAgent extends BaseAgent {
  constructor() {
    super(AgentType.MARKET_RESEARCH);
  }
  
  formatInput(context: AgentContext): string {
    const { targetGenre, keywords } = context.input || {};
    
    let prompt = `市場調査を実施し、収益性の高いマーケティングジャンルを特定してください。\n\n`;
    
    if (targetGenre) {
      prompt += `対象分野: ${targetGenre}\n`;
    }
    
    if (keywords && keywords.length > 0) {
      prompt += `関連キーワード: ${keywords.join(', ')}\n`;
    }
    
    prompt += `
以下の観点から分析を行い、最適なジャンルを推奨してください：
1. 現在のトレンド（検索ボリューム、SNSでの話題性）
2. 収益性（市場規模、顧客の購買意欲、価格帯）
3. 参入しやすさ（競合状況、必要な専門知識、初期投資）

出力は以下のJSON形式でお願いします：
{
  "recommended_genres": [
    {
      "genre": "ジャンル名",
      "trend_score": 85,
      "profitability_score": 92,
      "competition_level": "medium",
      "market_size": "○○億円",
      "target_audience": "30-40代女性",
      "reason": "選定理由の詳細",
      "keywords": ["キーワード1", "キーワード2"]
    }
  ],
  "analysis_summary": "市場分析の総括"
}`;
    
    return prompt;
  }
  
  parseOutput(response: string): MarketResearchOutput {
    return this.extractJson(response);
  }
  
  validateOutput(output: any): boolean {
    if (!output || typeof output !== 'object') return false;
    
    // 必須フィールドのチェック
    if (!Array.isArray(output.recommended_genres)) return false;
    if (!output.analysis_summary || typeof output.analysis_summary !== 'string') return false;
    
    // 各ジャンルの検証
    for (const genre of output.recommended_genres) {
      if (!genre.genre || typeof genre.genre !== 'string') return false;
      if (typeof genre.trend_score !== 'number') return false;
      if (typeof genre.profitability_score !== 'number') return false;
      if (!genre.competition_level || typeof genre.competition_level !== 'string') return false;
      if (!genre.market_size || typeof genre.market_size !== 'string') return false;
      if (!genre.target_audience || typeof genre.target_audience !== 'string') return false;
      if (!genre.reason || typeof genre.reason !== 'string') return false;
      if (!Array.isArray(genre.keywords)) return false;
    }
    
    return true;
  }
}
