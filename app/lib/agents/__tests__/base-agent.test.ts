// BaseAgent テストスイート

import { BaseAgent } from '../base';
import { AgentType, AgentContext } from '../../api/types';

// テスト用の具象クラス
class TestAgent extends BaseAgent {
  protected formatInput(input: any): any {
    return { ...input, formatted: true };
  }

  protected parseOutput(output: string): any {
    try {
      return JSON.parse(output);
    } catch {
      return { error: 'Invalid JSON', rawOutput: output };
    }
  }

  protected validateOutput(output: any): boolean {
    return output && typeof output === 'object' && !output.error;
  }

  protected generatePrompt(input: any): string {
    return `Test prompt with input: ${JSON.stringify(input)}`;
  }
}

describe('BaseAgent', () => {
  let testAgent: TestAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    testAgent = new TestAgent(AgentType.MARKET_RESEARCH);
    mockContext = {
      workflowId: 'test-workflow-123',
      agentId: 'test-agent-456',
      input: { target: 'test market' },
      previousOutputs: new Map()
    };

    // Gemini API のモック
    jest.mock('../../api/client', () => ({
      getGeminiClient: jest.fn(() => ({
        sendMessage: jest.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ result: 'test output' }) }]
            }
          }]
        })
      }))
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct agent type', () => {
      expect(testAgent.type).toBe(AgentType.MARKET_RESEARCH);
    });
  });

  describe('formatInput', () => {
    it('should format input correctly', () => {
      const input = { test: 'data' };
      const formatted = testAgent['formatInput'](input);
      
      expect(formatted).toEqual({
        test: 'data',
        formatted: true
      });
    });
  });

  describe('parseOutput', () => {
    it('should parse valid JSON output', () => {
      const validJson = '{"success": true, "data": "test"}';
      const parsed = testAgent['parseOutput'](validJson);
      
      expect(parsed).toEqual({
        success: true,
        data: 'test'
      });
    });

    it('should handle invalid JSON gracefully', () => {
      const invalidJson = 'invalid json string';
      const parsed = testAgent['parseOutput'](invalidJson);
      
      expect(parsed).toEqual({
        error: 'Invalid JSON',
        rawOutput: 'invalid json string'
      });
    });
  });

  describe('validateOutput', () => {
    it('should validate correct output', () => {
      const validOutput = { result: 'success' };
      const isValid = testAgent['validateOutput'](validOutput);
      
      expect(isValid).toBe(true);
    });

    it('should reject output with errors', () => {
      const invalidOutput = { error: 'Something went wrong' };
      const isValid = testAgent['validateOutput'](invalidOutput);
      
      expect(isValid).toBe(false);
    });

    it('should reject null or undefined output', () => {
      expect(testAgent['validateOutput'](null)).toBe(false);
      expect(testAgent['validateOutput'](undefined)).toBe(false);
    });
  });

  describe('generatePrompt', () => {
    it('should generate prompt with input data', () => {
      const input = { target: 'health market' };
      const prompt = testAgent['generatePrompt'](input);
      
      expect(prompt).toContain('Test prompt with input:');
      expect(prompt).toContain('"target":"health market"');
    });
  });

  describe('execute', () => {
    it('should execute successfully with valid context', async () => {
      // データベースモックも追加
      const mockPrisma = {
        agent: {
          update: jest.fn().mockResolvedValue({ id: 'test-agent-456' })
        }
      };

      // Prismaクライアントをモック
      jest.doMock('../../utils/db', () => ({
        __esModule: true,
        default: mockPrisma
      }));

      const result = await testAgent.execute(mockContext);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    }, 15000); // AI呼び出しのため長めのタイムアウト
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      // APIエラーをモック
      const { getGeminiClient } = require('../../api/client');
      getGeminiClient.mockReturnValue({
        sendMessage: jest.fn().mockRejectedValue(new Error('API Error'))
      });

      await expect(testAgent.execute(mockContext)).rejects.toThrow();
    });
  });
});

describe('BaseAgent integration', () => {
  it('should handle retry logic correctly', async () => {
    const testAgent = new TestAgent(AgentType.MARKET_RESEARCH);
    let callCount = 0;

    // 2回失敗して3回目で成功するモック
    const { getGeminiClient } = require('../../api/client');
    getGeminiClient.mockReturnValue({
      sendMessage: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ result: 'success after retry' }) }]
            }
          }]
        });
      })
    });

    const mockContext: AgentContext = {
      workflowId: 'test-workflow',
      agentId: 'test-agent',
      input: { test: 'data' },
      previousOutputs: new Map()
    };

    const result = await testAgent.execute(mockContext);
    expect(result).toBeDefined();
    expect(callCount).toBe(3); // 2回失敗 + 1回成功
  }, 20000);
});