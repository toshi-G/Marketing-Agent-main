// MarketResearchAgent テストスイート

import { MarketResearchAgent } from '../market-research';
import { AgentType, AgentContext } from '../../api/types';

// Gemini APIのモック
jest.mock('../../api/client', () => ({
  getGeminiClient: jest.fn(() => ({
    sendMessage: jest.fn()
  }))
}));

// Prismaクライアントのモック
jest.mock('../../utils/db', () => ({
  __esModule: true,
  default: {
    agent: {
      update: jest.fn().mockResolvedValue({ id: 'test-agent' })
    },
    marketData: {
      createMany: jest.fn().mockResolvedValue({ count: 3 })
    }
  }
}));

describe('MarketResearchAgent', () => {
  let agent: MarketResearchAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    agent = new MarketResearchAgent();
    mockContext = {
      workflowId: 'test-workflow-123',
      agentId: 'test-agent-456',
      input: { target: 'health and wellness' },
      previousOutputs: new Map()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with MARKET_RESEARCH type', () => {
      expect(agent.type).toBe(AgentType.MARKET_RESEARCH);
    });
  });

  describe('formatInput', () => {
    it('should format input with target market', () => {
      const input = { target: 'health and wellness' };
      const formatted = agent['formatInput'](input);
      
      expect(formatted).toHaveProperty('target');
      expect(formatted.target).toBe('health and wellness');
      expect(formatted).toHaveProperty('timestamp');
    });

    it('should handle empty target gracefully', () => {
      const input = {};
      const formatted = agent['formatInput'](input);
      
      expect(formatted).toHaveProperty('target');
      expect(formatted.target).toBe('general market');
    });
  });

  describe('generatePrompt', () => {
    it('should generate detailed market research prompt', () => {
      const input = { target: 'health and wellness', timestamp: Date.now() };
      const prompt = agent['generatePrompt'](input);
      
      expect(prompt).toContain('市場調査分析');
      expect(prompt).toContain('health and wellness');
      expect(prompt).toContain('JSON形式');
      expect(prompt).toContain('opportunities');
      expect(prompt).toContain('trendScore');
      expect(prompt).toContain('profitabilityScore');
    });

    it('should include required output structure', () => {
      const input = { target: 'tech startup', timestamp: Date.now() };
      const prompt = agent['generatePrompt'](input);
      
      // 必要な出力構造が含まれているかチェック
      expect(prompt).toContain('opportunities');
      expect(prompt).toContain('marketOverview');
      expect(prompt).toContain('trendAnalysis');
      expect(prompt).toContain('recommendations');
    });
  });

  describe('parseOutput', () => {
    it('should parse valid market research JSON', () => {
      const validOutput = JSON.stringify({
        opportunities: [
          {
            name: 'Health Tech Platform',
            description: 'AI-powered health monitoring',
            trendScore: 8.5,
            profitabilityScore: 7.2,
            marketSize: 'Large',
            competition: 'Medium'
          }
        ],
        marketOverview: {
          totalMarketSize: '$50B',
          growthRate: '15%',
          keyTrends: ['AI health', 'Telemedicine']
        },
        trendAnalysis: {
          emergingTrends: ['Wearable tech', 'Mental health apps'],
          decliningTrends: ['Traditional fitness'],
          opportunities: ['Remote healthcare']
        },
        recommendations: [
          'Focus on AI-powered solutions',
          'Target remote healthcare market'
        ]
      });

      const parsed = agent['parseOutput'](validOutput);
      
      expect(parsed).toHaveProperty('opportunities');
      expect(parsed.opportunities).toHaveLength(1);
      expect(parsed.opportunities[0]).toHaveProperty('name');
      expect(parsed.opportunities[0]).toHaveProperty('trendScore');
      expect(parsed).toHaveProperty('marketOverview');
      expect(parsed).toHaveProperty('trendAnalysis');
      expect(parsed).toHaveProperty('recommendations');
    });

    it('should handle malformed JSON gracefully', () => {
      const invalidOutput = 'This is not valid JSON {incomplete';
      const parsed = agent['parseOutput'](invalidOutput);
      
      expect(parsed).toHaveProperty('error');
      expect(parsed.error).toBe('Invalid JSON');
      expect(parsed).toHaveProperty('rawOutput');
    });
  });

  describe('validateOutput', () => {
    it('should validate complete market research output', () => {
      const validOutput = {
        opportunities: [
          {
            name: 'Test Opportunity',
            description: 'Test description',
            trendScore: 8.0,
            profitabilityScore: 7.5,
            marketSize: 'Large',
            competition: 'Medium'
          }
        ],
        marketOverview: {
          totalMarketSize: '$100B',
          growthRate: '10%',
          keyTrends: ['AI', 'Mobile']
        },
        trendAnalysis: {
          emergingTrends: ['AI'],
          decliningTrends: ['Legacy'],
          opportunities: ['New tech']
        },
        recommendations: ['Focus on AI']
      };

      const isValid = agent['validateOutput'](validOutput);
      expect(isValid).toBe(true);
    });

    it('should reject output missing opportunities', () => {
      const invalidOutput = {
        marketOverview: {},
        trendAnalysis: {},
        recommendations: []
      };

      const isValid = agent['validateOutput'](invalidOutput);
      expect(isValid).toBe(false);
    });

    it('should reject output with empty opportunities array', () => {
      const invalidOutput = {
        opportunities: [],
        marketOverview: {},
        trendAnalysis: {},
        recommendations: []
      };

      const isValid = agent['validateOutput'](invalidOutput);
      expect(isValid).toBe(false);
    });

    it('should reject opportunities missing required fields', () => {
      const invalidOutput = {
        opportunities: [
          {
            name: 'Test',
            // Missing required fields like trendScore, profitabilityScore
          }
        ],
        marketOverview: {},
        trendAnalysis: {},
        recommendations: []
      };

      const isValid = agent['validateOutput'](invalidOutput);
      expect(isValid).toBe(false);
    });
  });

  describe('execute integration', () => {
    it('should execute market research successfully', async () => {
      const mockGeminiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                opportunities: [
                  {
                    name: 'AI Health Platform',
                    description: 'Comprehensive health monitoring using AI',
                    trendScore: 9.1,
                    profitabilityScore: 8.3,
                    marketSize: 'Large ($50B+)',
                    competition: 'Medium'
                  }
                ],
                marketOverview: {
                  totalMarketSize: '$75B',
                  growthRate: '18%',
                  keyTrends: ['AI adoption', 'Remote healthcare']
                },
                trendAnalysis: {
                  emergingTrends: ['AI diagnostics', 'Wearable integration'],
                  decliningTrends: ['Traditional medical records'],
                  opportunities: ['Telemedicine expansion']
                },
                recommendations: [
                  'Invest in AI-powered diagnostic tools',
                  'Focus on user experience and accessibility'
                ]
              })
            }]
          }
        }]
      };

      const { getGeminiClient } = require('../../api/client');
      getGeminiClient.mockReturnValue({
        sendMessage: jest.fn().mockResolvedValue(mockGeminiResponse)
      });

      const result = await agent.execute(mockContext);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('opportunities');
      expect(result.opportunities).toHaveLength(1);
      expect(result.opportunities[0].name).toBe('AI Health Platform');
      expect(result.opportunities[0].trendScore).toBe(9.1);
    }, 15000);

    it('should handle API errors with retry', async () => {
      let callCount = 0;
      const { getGeminiClient } = require('../../api/client');
      
      getGeminiClient.mockReturnValue({
        sendMessage: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            throw new Error('Rate limit exceeded');
          }
          // 2回目は成功
          return Promise.resolve({
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({
                    opportunities: [{
                      name: 'Retry Success',
                      description: 'Success after retry',
                      trendScore: 7.5,
                      profitabilityScore: 6.8,
                      marketSize: 'Medium',
                      competition: 'High'
                    }],
                    marketOverview: { totalMarketSize: '$10B', growthRate: '5%', keyTrends: [] },
                    trendAnalysis: { emergingTrends: [], decliningTrends: [], opportunities: [] },
                    recommendations: ['Test recommendation']
                  })
                }]
              }
            }]
          });
        })
      });

      const result = await agent.execute(mockContext);
      
      expect(result).toBeDefined();
      expect(result.opportunities[0].name).toBe('Retry Success');
      expect(callCount).toBe(2); // 1回失敗 + 1回成功
    }, 20000);
  });
});