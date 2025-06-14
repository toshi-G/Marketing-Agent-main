// コンテンツ生成エージェント

import { BaseAgent, AgentContext } from './base';
import { 
  AgentType, 
  ContentCreationOutput,
  BusinessStrategyOutput,
  TemplateOptimizationOutput 
} from '../api/types';

export class ContentCreationAgent extends BaseAgent {
  constructor() {
    super(AgentType.CONTENT_CREATION);
  }
  
  formatInput(context: AgentContext): string {
    const businessStrategy = context.previousOutputs.get(AgentType.BUSINESS_STRATEGY) as BusinessStrategyOutput;
    const templateOptimization = context.previousOutputs.get(AgentType.TEMPLATE_OPTIMIZATION) as TemplateOptimizationOutput;
    
    if (!businessStrategy || !templateOptimization) {
      throw new Error('Business strategy and template optimization outputs are required');
    }
    
    const frontendProduct = businessStrategy.product_lineup.frontend;
    const template = templateOptimization.optimized_templates[0];
    
    let prompt = `以下の商品情報とテンプレートを基に、LP・SNSポスト・セールスメールを生成してください。

商品情報:
- 商品名: ${frontendProduct.name}
- 価格: ${frontendProduct.price}円
- 目的: ${frontendProduct.purpose}
- 内容: ${frontendProduct.content}

テンプレート情報:
- テンプレート名: ${template.template_name}
- 成功率: ${template.success_rate}%
- 推奨用途: ${template.best_for.join(', ')}

以下を作成してください：
1. ランディングページ（ヘッドライン、各セクション）
2. SNS投稿（Twitter、Instagram）
3. セールスメール（7通のステップメール）

出力は以下のJSON形式でお願いします：
{
  "landing_page": {
    "headline": "メインヘッドライン",
    "subheadline": "サブヘッドライン", 
    "sections": [
      {
        "type": "hero",
        "content": "ヒーローセクションの内容"
      },
      {
        "type": "problem",
        "content": "問題提起セクション"
      },
      {
        "type": "solution", 
        "content": "解決策セクション"
      },
      {
        "type": "benefits",
        "content": "ベネフィット説明"
      },
      {
        "type": "social_proof",
        "content": "お客様の声・実績"
      },
      {
        "type": "cta",
        "content": "行動喚起"
      }
    ],
    "design_notes": "デザイン指示・要素配置"
  },
  "sns_content": {
    "twitter": [
      {
        "post_text": "ツイート本文",
        "hashtags": ["#ハッシュタグ1", "#ハッシュタグ2"],
        "post_type": "awareness",
        "best_time": "19:00-21:00"
      }
    ],
    "instagram": [
      {
        "caption": "インスタグラム投稿文",
        "hashtags": ["#ハッシュタグ1", "#ハッシュタグ2"],
        "image_concept": "画像・動画のコンセプト",
        "post_type": "engagement"
      }
    ]
  },
  "email_sequence": [
    {
      "email_number": 1,
      "send_timing": "即時",
      "subject": "件名",
      "preheader": "プリヘッダー",
      "content": "メール本文",
      "cta": "行動喚起",
      "purpose": "関係構築"
    }
  ],
  "content_calendar": {
    "week1": ["コンテンツ1", "コンテンツ2"],
    "week2": ["コンテンツ3", "コンテンツ4"]
  }
}`;
    
    return prompt;
  }
  
  parseOutput(response: string): ContentCreationOutput {
    return this.extractJson(response);
  }
  
  validateOutput(output: any): boolean {
    if (!output || typeof output !== 'object') return false;
    
    // landing_pageの検証
    if (!output.landing_page || typeof output.landing_page !== 'object') return false;
    const lp = output.landing_page;
    if (!lp.headline || typeof lp.headline !== 'string') return false;
    if (!lp.subheadline || typeof lp.subheadline !== 'string') return false;
    if (!Array.isArray(lp.sections)) return false;
    if (!lp.design_notes || typeof lp.design_notes !== 'string') return false;
    
    // sns_contentの検証
    if (!output.sns_content || typeof output.sns_content !== 'object') return false;
    if (!Array.isArray(output.sns_content.twitter)) return false;
    if (!Array.isArray(output.sns_content.instagram)) return false;
    
    // email_sequenceの検証
    if (!Array.isArray(output.email_sequence)) return false;
    if (output.email_sequence.length < 7) return false;
    
    for (const email of output.email_sequence) {
      if (typeof email.email_number !== 'number') return false;
      if (!email.send_timing || typeof email.send_timing !== 'string') return false;
      if (!email.subject || typeof email.subject !== 'string') return false;
      if (!email.preheader || typeof email.preheader !== 'string') return false;
      if (!email.content || typeof email.content !== 'string') return false;
      if (!email.cta || typeof email.cta !== 'string') return false;
      if (!email.purpose || typeof email.purpose !== 'string') return false;
    }
    
    // content_calendarの検証
    if (!output.content_calendar || typeof output.content_calendar !== 'object') return false;
    
    return true;
  }
}
