"use strict";
// コンテンツスクレイピングエージェント
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentScrapingAgent = void 0;
const base_1 = require("./base");
const types_1 = require("../api/types");
class ContentScrapingAgent extends base_1.BaseAgent {
    constructor() {
        super(types_1.AgentType.CONTENT_SCRAPING);
    }
    formatInput(context) {
        const marketResearch = context.previousOutputs.get(types_1.AgentType.MARKET_RESEARCH);
        if (!marketResearch) {
            throw new Error('Market research output is required');
        }
        const topGenre = marketResearch.recommended_genres[0];
        let prompt = `以下のジャンルに関連するコンテンツトレンドを分析し、高反応フレーズと構成パターンを抽出してください。

ジャンル: ${topGenre.genre}
ターゲット: ${topGenre.target_audience}
関連キーワード: ${topGenre.keywords.join(', ')}

各プラットフォーム（Twitter/X、note、YouTube、Instagram）から以下を分析してください：
1. 高エンゲージメントを獲得しているフレーズ（最低50個）
2. 成功しているコンテンツの構成パターン
3. 感情を刺激する表現と行動を促すフレーズ

出力は以下のJSON形式でお願いします：
{
  "trending_phrases": [
    {
      "phrase": "抽出フレーズ",
      "platform": "Twitter",
      "engagement_rate": 8.5,
      "emotion_type": "驚き",
      "structure_type": "問題提起型",
      "context": "使用文脈"
    }
  ],
  "content_patterns": [
    {
      "pattern_name": "パターン名",
      "structure": "構成の説明",
      "success_rate": 78,
      "best_practices": ["ベストプラクティス1", "ベストプラクティス2"]
    }
  ],
  "total_analyzed": 150,
  "extraction_summary": "抽出結果の要約"
}`;
        return prompt;
    }
    parseOutput(response) {
        return this.extractJson(response);
    }
    validateOutput(output) {
        if (!output || typeof output !== 'object')
            return false;
        // 必須フィールドのチェック
        if (!Array.isArray(output.trending_phrases))
            return false;
        if (!Array.isArray(output.content_patterns))
            return false;
        if (typeof output.total_analyzed !== 'number')
            return false;
        if (!output.extraction_summary || typeof output.extraction_summary !== 'string')
            return false;
        // trending_phrasesの検証
        if (output.trending_phrases.length < 50)
            return false;
        for (const phrase of output.trending_phrases) {
            if (!phrase.phrase || typeof phrase.phrase !== 'string')
                return false;
            if (!phrase.platform || typeof phrase.platform !== 'string')
                return false;
            if (typeof phrase.engagement_rate !== 'number')
                return false;
            if (!phrase.emotion_type || typeof phrase.emotion_type !== 'string')
                return false;
            if (!phrase.structure_type || typeof phrase.structure_type !== 'string')
                return false;
            if (!phrase.context || typeof phrase.context !== 'string')
                return false;
        }
        // content_patternsの検証
        for (const pattern of output.content_patterns) {
            if (!pattern.pattern_name || typeof pattern.pattern_name !== 'string')
                return false;
            if (!pattern.structure || typeof pattern.structure !== 'string')
                return false;
            if (typeof pattern.success_rate !== 'number')
                return false;
            if (!Array.isArray(pattern.best_practices))
                return false;
        }
        return true;
    }
}
exports.ContentScrapingAgent = ContentScrapingAgent;
