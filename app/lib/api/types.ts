// API関連の型定義

// エージェントタイプ
export enum AgentType {
  MARKET_RESEARCH = 'market_research',
  CONTENT_SCRAPING = 'content_scraping',
  NLP_CLASSIFICATION = 'nlp_classification',
  TEMPLATE_OPTIMIZATION = 'template_optimization',
  BUSINESS_STRATEGY = 'business_strategy',
  CONTENT_CREATION = 'content_creation',
  COPY_GENERATION = 'copy_generation',
  OPTIMIZATION_ARCHIVE = 'optimization_archive'
}

// ワークフローステータス
export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// ①市場調査エージェントの出力
export interface MarketResearchOutput {
  recommended_genres: Array<{
    genre: string;
    trend_score: number;
    profitability_score: number;
    competition_level: string;
    market_size: string;
    target_audience: string;
    reason: string;
    keywords: string[];
  }>;
  analysis_summary: string;
}

// ②トレンドハンターエージェントの出力
export interface ContentScrapingOutput {
  trending_phrases: Array<{
    phrase: string;
    platform: string;
    engagement_rate: number;
    emotion_type: string;
    structure_type: string;
    context: string;
  }>;
  content_patterns: Array<{
    pattern_name: string;
    structure: string;
    success_rate: number;
    best_practices: string[];
  }>;
  total_analyzed: number;
  extraction_summary: string;
}

// ③NLP分類エージェントの出力
export interface NLPClassificationOutput {
  classified_data: {
    by_appeal_type: {
      benefit: Array<{ phrase: string; confidence: number }>;
      emotional: Array<{ phrase: string; confidence: number }>;
      authority: Array<{ phrase: string; confidence: number }>;
      scarcity: Array<{ phrase: string; confidence: number }>;
      social_proof: Array<{ phrase: string; confidence: number }>;
    };
    by_emotion: {
      positive: Array<{ phrase: string; emotion_intensity: number }>;
      negative: Array<{ phrase: string; emotion_intensity: number }>;
      neutral: Array<{ phrase: string; emotion_intensity: number }>;
    };
    by_structure: {
      problem_focused: Array<{ phrase: string; effectiveness_score: number }>;
      solution_focused: Array<{ phrase: string; effectiveness_score: number }>;
      story_based: Array<{ phrase: string; effectiveness_score: number }>;
      list_based: Array<{ phrase: string; effectiveness_score: number }>;
      comparison_based: Array<{ phrase: string; effectiveness_score: number }>;
    };
  };
  classification_stats: {
    total_classified: number;
    accuracy_rate: number;
    top_patterns: string[];
  };
}

// ④テンプレート最適化エージェントの出力
export interface TemplateOptimizationOutput {
  optimized_templates: Array<{
    template_id: string;
    template_name: string;
    success_rate: number;
    best_for: string[];
    structure: {
      hook: string;
      problem: string;
      agitation: string;
      solution: string;
      proof: string;
      cta: string;
    };
    variables: string[];
    example_usage: string;
    metrics: {
      engagement_rate: number;
      conversion_rate: number;
      read_through_rate: number;
    };
  }>;
  selection_criteria: {
    performance_threshold: number;
    versatility_score: number;
    ease_of_use: number;
  };
  testing_recommendations: string[];
}

// ⑤商品設計エージェントの出力
export interface BusinessStrategyOutput {
  product_lineup: {
    frontend: {
      name: string;
      price: number;
      purpose: string;
      content: string;
      profit_margin: number;
    };
    middle: {
      name: string;
      price: number;
      purpose: string;
      content: string;
      profit_margin: number;
    };
    backend: {
      name: string;
      price: number;
      purpose: string;
      content: string;
      profit_margin: number;
    };
  };
  sales_funnel: {
    [key: string]: {
      channels: string[];
      content_types: string[];
      kpi: string;
    };
  };
  roi_projection: {
    monthly_target_leads: number;
    conversion_rates: {
      frontend: number;
      middle: number;
      backend: number;
    };
    monthly_revenue: number;
    cost_structure: {
      advertising: number;
      content_creation: number;
      tools_and_systems: number;
    };
    net_profit: number;
    roi_percentage: number;
  };
}

// ⑥コンテンツ生成エージェントの出力
export interface ContentCreationOutput {
  landing_page: {
    headline: string;
    subheadline: string;
    sections: Array<{
      type: string;
      content: string;
    }>;
    design_notes: string;
  };
  sns_content: {
    twitter: Array<{
      post_text: string;
      hashtags: string[];
      post_type: string;
      best_time: string;
    }>;
    instagram: Array<{
      caption: string;
      hashtags: string[];
      image_concept: string;
      post_type: string;
    }>;
  };
  email_sequence: Array<{
    email_number: number;
    send_timing: string;
    subject: string;
    preheader: string;
    content: string;
    cta: string;
    purpose: string;
  }>;
  content_calendar: {
    [week: string]: string[];
  };
}

// ⑦コピー生成エージェントの出力
export interface CopyGenerationOutput {
  aggressive_hooks: Array<{
    title: string;
    hook_text: string;
    emotion_trigger: string;
    target_audience: string;
    expected_ctr: number;
  }>;
  empathy_hooks: Array<{
    title: string;
    hook_text: string;
    emotion_trigger: string;
    target_audience: string;
    expected_ctr: number;
  }>;
  contrarian_hooks: Array<{
    title: string;
    hook_text: string;
    emotion_trigger: string;
    target_audience: string;
    expected_ctr: number;
  }>;
  performance_prediction: {
    best_performing_category: string;
    overall_avg_ctr: number;
    a_b_test_recommendations: string[];
  };
  usage_guidelines: {
    aggressive: string;
    empathy: string;
    contrarian: string;
  };
}

// ⑧最適化エージェントの出力
export interface OptimizationArchiveOutput {
  optimization_results: {
    performance_metrics: {
      content_performance: {
        [key: string]: any;
      };
      overall_roi: {
        revenue_increase: number;
        cost_efficiency: number;
        time_saving: number;
      };
    };
    success_patterns: Array<{
      pattern_name: string;
      key_elements: string[];
      success_rate: number;
      applicable_industries: string[];
    }>;
    improvement_recommendations: Array<{
      area: string;
      current_performance: number;
      target_performance: number;
      action_items: string[];
    }>;
  };
  template_archive: {
    master_templates: Array<{
      template_id: string;
      name: string;
      components: string[];
      success_metrics: {
        avg_conversion_rate: number;
        avg_roi: number;
        usage_count: number;
      };
      customization_points: string[];
      file_locations: {
        templates: string;
        assets: string;
        documentation: string;
      };
    }>;
    version_history: Array<{
      version: string;
      date: string;
      changes: string[];
      performance_delta: number;
    }>;
  };
  automation_status: {
    automated_processes: string[];
    manual_review_points: string[];
    next_optimization_cycle: string;
  };
}

// API リクエスト/レスポンス型
export interface StartWorkflowRequest {
  name: string;
  initialInput?: {
    targetGenre?: string;
    keywords?: string[];
  };
}

export interface WorkflowResponse {
  id: string;
  name: string;
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  agents: AgentResponse[];
}

export interface AgentResponse {
  id: string;
  type: AgentType;
  status: WorkflowStatus;
  input?: any;
  output?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Gemini API関連
export interface GeminiPart {
  text: string;
}

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: {
    maxOutputTokens?: number;
    temperature?: number;
  };
  systemInstruction?: string;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}
