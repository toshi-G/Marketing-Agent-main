"use strict";
// NLP分類エージェント
Object.defineProperty(exports, "__esModule", { value: true });
exports.NLPClassificationAgent = void 0;
const base_1 = require("./base");
const types_1 = require("../api/types");
class NLPClassificationAgent extends base_1.BaseAgent {
    constructor() {
        super(types_1.AgentType.NLP_CLASSIFICATION);
    }
    formatInput(context) {
        const contentScraping = context.previousOutputs.get(types_1.AgentType.CONTENT_SCRAPING);
        if (!contentScraping) {
            throw new Error('Content scraping output is required');
        }
        const phrases = contentScraping.trending_phrases.map(p => p.phrase);
        let prompt = `以下のフレーズを自然言語処理の観点から分類してください。

分析対象フレーズ（${phrases.length}個）:
${phrases.join('\n')}

以下の3つの観点で分類を行ってください：

1. 訴求タイプ別分類
   - ベネフィット訴求（利益・メリット）
   - 感情訴求（不安・欲求・共感）
   - 権威訴求（専門性・実績）
   - 希少性訴求（限定・緊急性）
   - 社会的証明（口コミ・評判）

2. 感情ワード分類
   - ポジティブ感情（喜び・興奮・安心）
   - ネガティブ感情（不安・焦り・怒り）
   - 中性感情（疑問・興味・好奇心）

3. 構造別分類
   - 問題提起型
   - 解決提示型
   - ストーリー型
   - リスト型
   - 比較対照型

出力は以下のJSON形式でお願いします：
{
  "classified_data": {
    "by_appeal_type": {
      "benefit": [{"phrase": "フレーズ", "confidence": 0.92}],
      "emotional": [{"phrase": "フレーズ", "confidence": 0.88}],
      "authority": [{"phrase": "フレーズ", "confidence": 0.85}],
      "scarcity": [{"phrase": "フレーズ", "confidence": 0.90}],
      "social_proof": [{"phrase": "フレーズ", "confidence": 0.87}]
    },
    "by_emotion": {
      "positive": [{"phrase": "フレーズ", "emotion_intensity": 0.8}],
      "negative": [{"phrase": "フレーズ", "emotion_intensity": 0.9}],
      "neutral": [{"phrase": "フレーズ", "emotion_intensity": 0.6}]
    },
    "by_structure": {
      "problem_focused": [{"phrase": "フレーズ", "effectiveness_score": 85}],
      "solution_focused": [{"phrase": "フレーズ", "effectiveness_score": 78}],
      "story_based": [{"phrase": "フレーズ", "effectiveness_score": 82}],
      "list_based": [{"phrase": "フレーズ", "effectiveness_score": 75}],
      "comparison_based": [{"phrase": "フレーズ", "effectiveness_score": 80}]
    }
  },
  "classification_stats": {
    "total_classified": ${phrases.length},
    "accuracy_rate": 0.87,
    "top_patterns": ["パターン1", "パターン2", "パターン3"]
  }
}`;
        return prompt;
    }
    parseOutput(response) {
        return this.extractJson(response);
    }
    validateOutput(output) {
        if (!output || typeof output !== 'object')
            return false;
        // classified_dataの検証
        if (!output.classified_data || typeof output.classified_data !== 'object')
            return false;
        // by_appeal_typeの検証
        const appealTypes = ['benefit', 'emotional', 'authority', 'scarcity', 'social_proof'];
        for (const type of appealTypes) {
            if (!Array.isArray(output.classified_data.by_appeal_type[type]))
                return false;
        }
        // by_emotionの検証
        const emotionTypes = ['positive', 'negative', 'neutral'];
        for (const type of emotionTypes) {
            if (!Array.isArray(output.classified_data.by_emotion[type]))
                return false;
        }
        // by_structureの検証
        const structureTypes = ['problem_focused', 'solution_focused', 'story_based', 'list_based', 'comparison_based'];
        for (const type of structureTypes) {
            if (!Array.isArray(output.classified_data.by_structure[type]))
                return false;
        }
        // classification_statsの検証
        if (!output.classification_stats || typeof output.classification_stats !== 'object')
            return false;
        if (typeof output.classification_stats.total_classified !== 'number')
            return false;
        if (typeof output.classification_stats.accuracy_rate !== 'number')
            return false;
        if (!Array.isArray(output.classification_stats.top_patterns))
            return false;
        return true;
    }
}
exports.NLPClassificationAgent = NLPClassificationAgent;
