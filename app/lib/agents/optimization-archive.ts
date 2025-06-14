// 最適化・保存エージェント

import { BaseAgent, AgentContext } from './base';
import { 
  AgentType, 
  OptimizationArchiveOutput,
  ContentCreationOutput,
  CopyGenerationOutput,
  BusinessStrategyOutput 
} from '../api/types';

export class OptimizationArchiveAgent extends BaseAgent {
  constructor() {
    super(AgentType.OPTIMIZATION_ARCHIVE);
  }
  
  formatInput(context: AgentContext): string {
    const contentCreation = context.previousOutputs.get(AgentType.CONTENT_CREATION) as ContentCreationOutput;
    const copyGeneration = context.previousOutputs.get(AgentType.COPY_GENERATION) as CopyGenerationOutput;
    const businessStrategy = context.previousOutputs.get(AgentType.BUSINESS_STRATEGY) as BusinessStrategyOutput;
    
    if (!contentCreation || !copyGeneration || !businessStrategy) {
      throw new Error('Content creation, copy generation, and business strategy outputs are required');
    }
    
    let prompt = `全工程の結果を分析し、パフォーマンスを最適化してテンプレート化してください。

生成されたコンテンツ:
- LP: ${contentCreation.landing_page.sections.length}セクション
- SNS投稿: Twitter ${contentCreation.sns_content.twitter.length}件、Instagram ${contentCreation.sns_content.instagram.length}件
- メールシーケンス: ${contentCreation.email_sequence.length}通

生成されたコピー:
- 煽り系: ${copyGeneration.aggressive_hooks.length}個
- 共感系: ${copyGeneration.empathy_hooks.length}個
- 逆張り系: ${copyGeneration.contrarian_hooks.length}個
- 平均CTR予測: ${copyGeneration.performance_prediction.overall_avg_ctr}%

ROI予測:
- 月間収益予測: ${businessStrategy.roi_projection.monthly_revenue}円
- ROI: ${businessStrategy.roi_projection.roi_percentage}%

以下を実行してください：
1. 各コンテンツのパフォーマンス予測と改善提案
2. 成功パターンの体系化とテンプレート化
3. 再利用可能な形式でのアーカイブ設計

出力は以下のJSON形式でお願いします：
{
  "optimization_results": {
    "performance_metrics": {
      "content_performance": {
        "landing_page": {
          "conversion_rate": 12.5,
          "improvement_from_baseline": 34,
          "top_performing_elements": ["ヘッドライン", "CTA配置", "社会的証明"]
        },
        "sns_posts": {
          "engagement_rate": 8.7,
          "click_through_rate": 4.2,
          "best_performing_type": "逆張り系"
        },
        "email_sequence": {
          "open_rate": 28.5,
          "click_rate": 9.8,
          "unsubscribe_rate": 1.2
        }
      },
      "overall_roi": {
        "revenue_increase": 156,
        "cost_efficiency": 89,
        "time_saving": 73
      }
    },
    "success_patterns": [
      {
        "pattern_name": "高コンバージョンLP構成",
        "key_elements": ["要素1", "要素2", "要素3"],
        "success_rate": 85,
        "applicable_industries": ["美容", "副業", "スキルアップ"]
      }
    ],
    "improvement_recommendations": [
      {
        "area": "メールマーケティング",
        "current_performance": 9.8,
        "target_performance": 12.0,
        "action_items": ["件名最適化", "送信タイミング調整", "セグメント細分化"]
      }
    ]
  },
  "template_archive": {
    "master_templates": [
      {
        "template_id": "MT_001",
        "name": "高収益型LP+ファネルセット",
        "components": ["LP", "SNS投稿×10", "メール×7", "タイトル×20"],
        "success_metrics": {
          "avg_conversion_rate": 11.2,
          "avg_roi": 234,
          "usage_count": 47
        },
        "customization_points": ["業界", "価格帯", "ターゲット年齢"],
        "file_locations": {
          "templates": "/templates/MT_001/",
          "assets": "/assets/MT_001/",
          "documentation": "/docs/MT_001.md"
        }
      }
    ],
    "version_history": [
      {
        "version": "v2.1",
        "date": "2024-06-10",
        "changes": ["CTAボタン色最適化", "ヘッドライン改善"],
        "performance_delta": 8.5
      }
    ]
  },
  "automation_status": {
    "automated_processes": [
      "パフォーマンス測定",
      "A/Bテスト実行",
      "レポート生成",
      "アラート通知"
    ],
    "manual_review_points": [
      "コンテンツ品質チェック",
      "ブランド一貫性確認",
      "法的コンプライアンス"
    ],
    "next_optimization_cycle": "2024-06-17"
  }
}`;
    
    return prompt;
  }
  
  parseOutput(response: string): OptimizationArchiveOutput {
    return this.extractJson(response);
  }
  
  validateOutput(output: any): boolean {
    if (!output || typeof output !== 'object') return false;
    
    // optimization_resultsの検証
    if (!output.optimization_results || typeof output.optimization_results !== 'object') return false;
    
    // performance_metricsの検証
    const metrics = output.optimization_results.performance_metrics;
    if (!metrics || typeof metrics !== 'object') return false;
    if (!metrics.content_performance || typeof metrics.content_performance !== 'object') return false;
    if (!metrics.overall_roi || typeof metrics.overall_roi !== 'object') return false;
    
    // success_patternsの検証
    if (!Array.isArray(output.optimization_results.success_patterns)) return false;
    
    // improvement_recommendationsの検証
    if (!Array.isArray(output.optimization_results.improvement_recommendations)) return false;
    
    // template_archiveの検証
    if (!output.template_archive || typeof output.template_archive !== 'object') return false;
    if (!Array.isArray(output.template_archive.master_templates)) return false;
    if (!Array.isArray(output.template_archive.version_history)) return false;
    
    // automation_statusの検証
    if (!output.automation_status || typeof output.automation_status !== 'object') return false;
    if (!Array.isArray(output.automation_status.automated_processes)) return false;
    if (!Array.isArray(output.automation_status.manual_review_points)) return false;
    if (!output.automation_status.next_optimization_cycle) return false;
    
    return true;
  }
}
