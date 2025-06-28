"use strict";
// コピー生成エージェント
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopyGenerationAgent = void 0;
const base_1 = require("./base");
const types_1 = require("../api/types");
class CopyGenerationAgent extends base_1.BaseAgent {
    constructor() {
        super(types_1.AgentType.COPY_GENERATION);
    }
    formatInput(context) {
        const marketResearch = context.previousOutputs.get(types_1.AgentType.MARKET_RESEARCH);
        const businessStrategy = context.previousOutputs.get(types_1.AgentType.BUSINESS_STRATEGY);
        if (!marketResearch || !businessStrategy) {
            throw new Error('Market research and business strategy outputs are required');
        }
        const genre = marketResearch.recommended_genres[0];
        const products = businessStrategy.product_lineup;
        let prompt = `以下の情報を基に、煽り系・共感系・逆張り系でパターン分けしたタイトル・フックを各20個以上生成してください。

ジャンル: ${genre.genre}
ターゲット: ${genre.target_audience}
商品ラインナップ:
- フロント: ${products.frontend.name} (${products.frontend.price}円)
- ミドル: ${products.middle.name} (${products.middle.price}円)
- バック: ${products.backend.name} (${products.backend.price}円)

以下の3つのカテゴリーで生成してください：

1. 煽り系（緊急性・希少性を強調）
2. 共感系（悩みへの理解・寄り添い）
3. 逆張り系（常識を覆す・意外性）

出力は以下のJSON形式でお願いします：
{
  "aggressive_hooks": [
    {
      "title": "【警告】その●●、本当に大丈夫ですか？",
      "hook_text": "あなたが知らない危険な事実",
      "emotion_trigger": "不安・緊急性",
      "target_audience": "積極的行動層",
      "expected_ctr": 8.5
    }
  ],
  "empathy_hooks": [
    {
      "title": "私も同じでした...●●で悩んでいたあの頃",
      "hook_text": "共感から始まる解決ストーリー",
      "emotion_trigger": "共感・安心",
      "target_audience": "慎重検討層",
      "expected_ctr": 6.8
    }
  ],
  "contrarian_hooks": [
    {
      "title": "実は●●は間違いです【真実を公開】",
      "hook_text": "常識を覆す新事実",
      "emotion_trigger": "驚き・好奇心",
      "target_audience": "情報感度高層",
      "expected_ctr": 9.2
    }
  ],
  "performance_prediction": {
    "best_performing_category": "contrarian",
    "overall_avg_ctr": 8.1,
    "a_b_test_recommendations": [
      "煽り系 vs 共感系での比較テスト",
      "逆張り系での数字有無比較"
    ]
  },
  "usage_guidelines": {
    "aggressive": "初回訪問者・冷たいトラフィックに効果的",
    "empathy": "既存顧客・温かいトラフィックに効果的", 
    "contrarian": "知識欲の高いセグメントに効果的"
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
        // 各フックカテゴリーの検証
        const hookCategories = ['aggressive_hooks', 'empathy_hooks', 'contrarian_hooks'];
        for (const category of hookCategories) {
            if (!Array.isArray(output[category]))
                return false;
            if (output[category].length < 20)
                return false;
            for (const hook of output[category]) {
                if (!hook.title || typeof hook.title !== 'string')
                    return false;
                if (!hook.hook_text || typeof hook.hook_text !== 'string')
                    return false;
                if (!hook.emotion_trigger || typeof hook.emotion_trigger !== 'string')
                    return false;
                if (!hook.target_audience || typeof hook.target_audience !== 'string')
                    return false;
                if (typeof hook.expected_ctr !== 'number')
                    return false;
            }
        }
        // performance_predictionの検証
        if (!output.performance_prediction || typeof output.performance_prediction !== 'object')
            return false;
        const perf = output.performance_prediction;
        if (!perf.best_performing_category || typeof perf.best_performing_category !== 'string')
            return false;
        if (typeof perf.overall_avg_ctr !== 'number')
            return false;
        if (!Array.isArray(perf.a_b_test_recommendations))
            return false;
        // usage_guidelinesの検証
        if (!output.usage_guidelines || typeof output.usage_guidelines !== 'object')
            return false;
        const guidelines = ['aggressive', 'empathy', 'contrarian'];
        for (const guideline of guidelines) {
            if (!output.usage_guidelines[guideline] || typeof output.usage_guidelines[guideline] !== 'string') {
                return false;
            }
        }
        return true;
    }
}
exports.CopyGenerationAgent = CopyGenerationAgent;
