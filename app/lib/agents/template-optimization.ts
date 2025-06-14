// テンプレート最適化エージェント

import { BaseAgent, AgentContext } from './base';
import { AgentType, TemplateOptimizationOutput, NLPClassificationOutput } from '../api/types';

export class TemplateOptimizationAgent extends BaseAgent {
  constructor() {
    super(AgentType.TEMPLATE_OPTIMIZATION);
  }
  
  formatInput(context: AgentContext): string {
    const nlpClassification = context.previousOutputs.get(AgentType.NLP_CLASSIFICATION) as NLPClassificationOutput;
    
    if (!nlpClassification) {
      throw new Error('NLP classification output is required');
    }
    
    let prompt = `分類されたデータから、最も興味関心を惹きつける構成パターン5つを選出し、テンプレート化してください。

分類データの統計:
- 総分類数: ${nlpClassification.classification_stats.total_classified}
- 精度: ${nlpClassification.classification_stats.accuracy_rate}
- トップパターン: ${nlpClassification.classification_stats.top_patterns.join(', ')}

以下の観点から最適なテンプレートを設計してください：
1. エンゲージメント率の高いパターンを特定
2. コンバージョンに繋がりやすい構成を分析
3. 再現性の高い構成フレームワークを作成
4. 変数部分と固定部分を明確に分離

出力は以下のJSON形式でお願いします：
{
  "optimized_templates": [
    {
      "template_id": "T001",
      "template_name": "問題解決型テンプレート",
      "success_rate": 85,
      "best_for": ["悩み解決", "ハウツー", "コンサル"],
      "structure": {
        "hook": "[問題提起フック]は本当ですか？",
        "problem": "多くの人が[具体的な問題]で悩んでいます",
        "agitation": "実は[意外な事実]が原因かも知れません",
        "solution": "[具体的な解決策]で解決できます",
        "proof": "[実績・データ・事例]",
        "cta": "今すぐ[アクション]してください"
      },
      "variables": ["問題提起フック", "具体的な問題", "意外な事実", "具体的な解決策", "実績・データ・事例", "アクション"],
      "example_usage": "ダイエット、副業、スキルアップ等",
      "metrics": {
        "engagement_rate": 12.5,
        "conversion_rate": 8.2,
        "read_through_rate": 78
      }
    }
  ],
  "selection_criteria": {
    "performance_threshold": 80,
    "versatility_score": 85,
    "ease_of_use": 90
  },
  "testing_recommendations": ["A/Bテスト案1", "A/Bテスト案2"]
}`;
    
    return prompt;
  }
  
  parseOutput(response: string): TemplateOptimizationOutput {
    return this.extractJson(response);
  }
  
  validateOutput(output: any): boolean {
    if (!output || typeof output !== 'object') return false;
    
    // optimized_templatesの検証
    if (!Array.isArray(output.optimized_templates)) return false;
    if (output.optimized_templates.length !== 5) return false;
    
    for (const template of output.optimized_templates) {
      if (!template.template_id || typeof template.template_id !== 'string') return false;
      if (!template.template_name || typeof template.template_name !== 'string') return false;
      if (typeof template.success_rate !== 'number') return false;
      if (!Array.isArray(template.best_for)) return false;
      if (!template.structure || typeof template.structure !== 'object') return false;
      if (!Array.isArray(template.variables)) return false;
      if (!template.example_usage || typeof template.example_usage !== 'string') return false;
      if (!template.metrics || typeof template.metrics !== 'object') return false;
    }
    
    // selection_criteriaの検証
    if (!output.selection_criteria || typeof output.selection_criteria !== 'object') return false;
    if (typeof output.selection_criteria.performance_threshold !== 'number') return false;
    if (typeof output.selection_criteria.versatility_score !== 'number') return false;
    if (typeof output.selection_criteria.ease_of_use !== 'number') return false;
    
    // testing_recommendationsの検証
    if (!Array.isArray(output.testing_recommendations)) return false;
    
    return true;
  }
}
