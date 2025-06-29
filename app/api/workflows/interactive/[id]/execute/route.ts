// Interactive Workflow Step Execution API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/utils/db';
import { getErrorMessage } from '@/lib/utils';

// POST /api/workflows/interactive/[id]/execute - ステップ実行
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;
    const body = await request.json();
    const { stepId, input } = body;

    if (!stepId) {
      return NextResponse.json(
        { error: 'stepId is required' },
        { status: 400 }
      );
    }

    // エージェント（ステップ）を取得
    const agent = await prisma.agent.findFirst({
      where: {
        id: stepId,
        workflowId: workflowId
      }
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Step not found' },
        { status: 404 }
      );
    }

    // 実行中に更新
    await prisma.agent.update({
      where: { id: stepId },
      data: {
        status: 'running',
        input: input ? JSON.stringify(input) : agent.input
      }
    });

    // エージェント実行をシミュレート
    const result = await executeAgentStep(agent.type, input || JSON.parse(agent.input || '{}'));

    // 結果を保存
    const updatedAgent = await prisma.agent.update({
      where: { id: stepId },
      data: {
        status: result.success ? 'completed' : 'failed',
        output: result.success ? JSON.stringify(result.output) : null,
        error: result.success ? null : result.error,
        completedAt: result.success ? new Date() : null
      }
    });

    // ワークフローステータスを更新
    await updateWorkflowStatus(workflowId);

    return NextResponse.json({
      stepId,
      status: updatedAgent.status,
      output: result.success ? result.output : null,
      error: result.success ? null : result.error,
      executionTime: result.executionTime
    });

  } catch (error) {
    console.error('Step execution error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// エージェントステップ実行（シミュレーション）
async function executeAgentStep(agentType: string, input: any) {
  const startTime = Date.now();
  
  try {
    // 実行時間をシミュレート
    const executionDelay = 1000 + Math.random() * 4000; // 1-5秒
    await new Promise(resolve => setTimeout(resolve, executionDelay));

    // 90%の成功率
    const success = Math.random() > 0.1;
    
    if (!success) {
      throw new Error('Agent execution failed');
    }

    // エージェントタイプに応じた出力を生成
    const output = generateAgentOutput(agentType, input);
    
    return {
      success: true,
      output,
      executionTime: Date.now() - startTime
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: Date.now() - startTime
    };
  }
}

// エージェント出力生成
function generateAgentOutput(agentType: string, input: any) {
  const outputs: Record<string, any> = {
    market_research: {
      market_analysis: {
        target_market: input.target || 'ビジネス',
        market_size: `約${Math.floor(Math.random() * 1000) + 100}億円`,
        growth_rate: `${Math.floor(Math.random() * 20) + 5}%`,
        competition_level: ['低', '中', '高'][Math.floor(Math.random() * 3)],
        opportunities: [
          'デジタル化の加速',
          'リモートワークの普及',
          'AI技術の活用'
        ]
      },
      target_analysis: {
        primary_target: '30-40代ビジネスパーソン',
        demographics: {
          age: '30-40歳',
          income: '500-1000万円',
          occupation: 'サラリーマン・経営者'
        },
        pain_points: [
          '効率化したい',
          '時間がない',
          'スキルアップしたい'
        ],
        motivations: [
          '収入向上',
          'キャリアアップ',
          '自己実現'
        ]
      }
    },

    content_scraping: {
      collected_content: {
        total_posts: Math.floor(Math.random() * 200) + 50,
        high_engagement_posts: [
          {
            text: '知らないと損する○○の裏技',
            engagement_rate: Math.floor(Math.random() * 30) + 70,
            platform: input.platform || 'Instagram'
          },
          {
            text: '【保存版】○○の完全攻略法',
            engagement_rate: Math.floor(Math.random() * 25) + 75,
            platform: input.platform || 'Instagram'
          },
          {
            text: '99%の人が間違っている○○の方法',
            engagement_rate: Math.floor(Math.random() * 20) + 80,
            platform: input.platform || 'Instagram'
          }
        ],
        trending_hashtags: [
          '#効率化',
          '#ライフハック',
          '#生産性向上',
          '#時短術',
          '#スキルアップ'
        ],
        content_patterns: {
          question_hooks: '○○について質問です',
          curiosity_hooks: '知らないと損する○○',
          urgency_hooks: '今すぐやるべき○○',
          authority_hooks: 'プロが教える○○'
        }
      }
    },

    nlp_classification: {
      sentiment_analysis: {
        positive: Math.floor(Math.random() * 30) + 60,
        neutral: Math.floor(Math.random() * 20) + 10,
        negative: Math.floor(Math.random() * 20) + 5
      },
      emotion_classification: {
        excitement: Math.floor(Math.random() * 40) + 30,
        curiosity: Math.floor(Math.random() * 50) + 40,
        urgency: Math.floor(Math.random() * 30) + 20,
        trust: Math.floor(Math.random() * 35) + 45
      },
      content_structure: {
        hooks: ['好奇心型', '緊急性型', '権威型', '共感型'],
        story_patterns: ['問題→解決', '成功事例', 'ビフォーアフター'],
        cta_types: ['今すぐ型', '限定型', '無料型', '保証型']
      }
    },

    template_optimization: {
      optimized_templates: [
        {
          name: '高コンバージョンLPテンプレート',
          success_rate: Math.floor(Math.random() * 20) + 80,
          conversion_rate: (Math.random() * 10 + 5).toFixed(2),
          structure: {
            headline: '【限定公開】○○で△△を実現する秘密',
            subheadline: '業界トップ1%だけが知る究極のメソッド',
            problem: '現在○○で悩んでいませんか？',
            solution: '私たちの独自メソッドなら...',
            proof: '10,000人以上の成功実績',
            cta: '今すぐ無料で確認する'
          }
        }
      ],
      performance_insights: {
        best_performing_elements: [
          '限定性を強調するヘッドライン',
          '具体的な数値による実績',
          '緊急性のあるCTA'
        ],
        optimization_recommendations: [
          'ヘッドラインの限定性を強化',
          'ソーシャルプルーフの追加',
          'CTAボタンの色とテキスト最適化'
        ]
      }
    },

    business_strategy: {
      product_strategy: {
        product_line: [
          {
            name: 'エントリープラン',
            price: '月額9,800円',
            target: '初心者・個人事業主',
            features: ['基本機能', 'メールサポート']
          },
          {
            name: 'プロフェッショナルプラン',
            price: '月額29,800円',
            target: '中級者・小規模企業',
            features: ['全機能', '電話サポート', '個別コンサル']
          }
        ],
        pricing_strategy: {
          model: 'サブスクリプション',
          free_trial: '14日間',
          discount_strategy: '年間契約で20%オフ'
        }
      },
      sales_funnel: {
        awareness: {
          channels: ['SNS広告', 'コンテンツマーケティング', 'SEO'],
          metrics: ['リーチ', 'インプレッション', 'エンゲージメント']
        },
        consideration: {
          tactics: ['無料コンテンツ', 'ウェビナー', 'ケーススタディ'],
          metrics: ['リード獲得数', '資料ダウンロード数']
        },
        conversion: {
          tactics: ['無料トライアル', '個別相談', '限定オファー'],
          metrics: ['コンバージョン率', 'CAC', 'LTV']
        }
      }
    },

    content_creation: {
      landing_page: {
        headline: '【限定公開】30日で○○を劇的に改善する秘密',
        subheadline: '業界トップ1%だけが知る究極のメソッドを今だけ特別公開',
        hero_section: {
          main_benefit: '○○で結果を出したい方へ',
          supporting_benefits: [
            '30日で効果実感',
            '業界No.1の実績',
            '完全サポート付き'
          ]
        },
        problem_section: {
          headline: 'こんな悩みはありませんか？',
          problems: [
            '○○がうまくいかない',
            '効果的な方法がわからない',
            '時間ばかりかかって成果が出ない'
          ]
        },
        solution_section: {
          headline: 'その悩み、○○で解決できます',
          features: [
            {
              title: '簡単3ステップ',
              description: '誰でも実践できる簡単な方法'
            },
            {
              title: '実績No.1',
              description: '10,000人以上の成功実績'
            }
          ]
        },
        cta: {
          primary: '今すぐ無料で試してみる',
          secondary: '詳しい資料をダウンロード'
        }
      },
      social_posts: [
        {
          platform: 'Instagram',
          text: '【知らないと損】○○の裏技シェア📝\n\n✅ ○○で時間短縮\n✅ ○○でコスト削減\n✅ ○○で効率アップ\n\n実際に試した結果...\n（続きはストーリーで💡）',
          hashtags: ['#効率化', '#ライフハック', '#時短術']
        },
        {
          platform: 'Twitter',
          text: '○○について質問です🤔\n\n皆さんは○○でどんな工夫をしていますか？\n\n私は最近○○を始めて、効果を実感しています💪\n\nぜひ教えてください！\n\n#○○ #効率化'
        }
      ],
      email_sequence: [
        {
          subject: '【重要】○○について知っていますか？',
          body: 'はじめまして。\n\n今日から7日間、○○についてお話しします。\n\n実は、○○で成功する人と失敗する人には、決定的な違いがあります...',
          timing: '登録直後'
        },
        {
          subject: '【Day2】多くの人が勘違いしていること',
          body: '昨日のメールはご覧いただけましたか？\n\n今日は、○○について多くの人が勘違いしていることをお話しします...',
          timing: '1日後'
        }
      ]
    },

    copy_generation: {
      hooks: [
        {
          type: 'curiosity',
          text: '知らないと損する○○の裏技',
          engagement_score: Math.floor(Math.random() * 20) + 80
        },
        {
          type: 'urgency',
          text: '今すぐやるべき○○の方法',
          engagement_score: Math.floor(Math.random() * 15) + 85
        },
        {
          type: 'social_proof',
          text: '10,000人が実践している○○',
          engagement_score: Math.floor(Math.random() * 25) + 75
        },
        {
          type: 'benefit',
          text: '○○で人生が変わる理由',
          engagement_score: Math.floor(Math.random() * 30) + 70
        }
      ],
      headlines: [
        '【限定公開】○○で△△を実現する秘密',
        '99%の人が知らない○○の真実',
        '【保存版】○○の完全攻略法',
        '今すぐ使える○○のテクニック'
      ],
      cta_variations: [
        '今すぐ無料で確認する',
        '限定特典を受け取る',
        '詳しい資料をダウンロード',
        '無料相談を申し込む'
      ]
    },

    optimization_archive: {
      archived_templates: [
        {
          id: `template-${Date.now()}`,
          name: '高コンバージョンLPテンプレート',
          category: 'landing_page',
          performance: {
            success_rate: Math.floor(Math.random() * 20) + 80,
            usage_count: Math.floor(Math.random() * 50) + 10,
            conversion_rate: (Math.random() * 10 + 5).toFixed(2)
          }
        }
      ],
      optimization_insights: {
        best_practices: [
          'ヘッドラインに限定性を含める',
          'ソーシャルプルーフを複数箇所に配置',
          'CTAボタンは目立つ色を使用'
        ],
        performance_patterns: {
          high_converting_elements: [
            '数値による実績表示',
            '緊急性のある表現',
            'Before/After比較'
          ],
          optimal_timings: {
            email_send: '火曜日 10:00-11:00',
            social_post: '平日 19:00-21:00',
            ad_campaign: '金曜日夕方開始'
          }
        }
      }
    }
  };

  return outputs[agentType] || {
    result: 'エージェント実行完了',
    timestamp: new Date().toISOString(),
    input_received: input
  };
}

// ワークフローステータス更新
async function updateWorkflowStatus(workflowId: string) {
  const agents = await prisma.agent.findMany({
    where: { workflowId },
    select: { status: true }
  });

  const totalAgents = agents.length;
  const completedAgents = agents.filter(a => a.status === 'completed').length;
  const failedAgents = agents.filter(a => a.status === 'failed').length;
  const runningAgents = agents.filter(a => a.status === 'running').length;

  let workflowStatus = 'pending';
  
  if (runningAgents > 0) {
    workflowStatus = 'running';
  } else if (completedAgents === totalAgents) {
    workflowStatus = 'completed';
  } else if (failedAgents > 0) {
    workflowStatus = 'failed';
  }

  await prisma.workflow.update({
    where: { id: workflowId },
    data: { 
      status: workflowStatus,
      completedAt: workflowStatus === 'completed' ? new Date() : null
    }
  });
}