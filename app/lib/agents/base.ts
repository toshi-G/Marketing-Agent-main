// エージェント基底クラス

import { getGeminiClient } from '../api/client';
import { API_CONFIG, AGENT_PROMPTS } from '../api/config';
import { AgentType, WorkflowStatus } from '../api/types';
import prisma from '../utils/db';
import { delay, getErrorMessage } from '../utils';
import { createAgentLogger, logError, logPerformance } from '../utils/logger';

export interface AgentContext {
  workflowId: string;
  agentId: string;
  input: any;
  previousOutputs: Map<AgentType, any>;
}

export abstract class BaseAgent {
  protected type: AgentType;
  protected systemPrompt: string;
  
  constructor(type: AgentType) {
    this.type = type;
    this.systemPrompt = AGENT_PROMPTS[type];
  }
  
  abstract formatInput(context: AgentContext): string;
  abstract parseOutput(response: string): any;
  abstract validateOutput(output: any): boolean;
  
  async execute(context: AgentContext): Promise<any> {
    const { workflowId, agentId } = context;
    const logger = createAgentLogger(workflowId, this.type, agentId);
    const startTime = Date.now();
    
    logger.info('Agent execution started', { 
      agentType: this.type,
      inputSize: JSON.stringify(context.input).length,
      previousOutputsCount: context.previousOutputs.size
    });
    
    try {
      // ステータスを実行中に更新
      await prisma.agent.update({
        where: { id: agentId },
        data: { status: WorkflowStatus.RUNNING }
      });
      
      logger.info('Agent status updated to running');
      
      // 入力をフォーマット
      const userMessage = this.formatInput(context);
      logger.debug('Input formatted', { inputLength: userMessage.length });
      
      // Gemini APIを呼び出し
      const geminiClient = getGeminiClient();
      const response = await this.callGeminiWithRetry(geminiClient, userMessage, logger);
      
      // 出力をパース
      const output = this.parseOutput(response);
      logger.info('Output parsed successfully', { outputType: typeof output });
      
      // 出力を検証
      if (!this.validateOutput(output)) {
        throw new Error('Invalid output format');
      }
      
      logger.info('Output validation passed');
      
      // 結果を保存
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          status: WorkflowStatus.COMPLETED,
          output: JSON.stringify(output),
          completedAt: new Date()
        }
      });
      
      logPerformance(logger, 'agent_execution', startTime, {
        agentType: this.type,
        success: true
      });
      
      logger.info('Agent execution completed successfully');
      return output;
      
    } catch (error) {
      logError(logger, error, {
        agentType: this.type,
        workflowId,
        agentId
      });
      
      // エラーを記録
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          status: WorkflowStatus.FAILED,
          error: getErrorMessage(error),
          completedAt: new Date()
        }
      });
      
      logPerformance(logger, 'agent_execution', startTime, {
        agentType: this.type,
        success: false
      });
      
      throw error;
    }
  }
  
  private async callGeminiWithRetry(
    client: any,
    userMessage: string,
    logger: any
  ): Promise<string> {
    let lastError: Error | null = null;
    
    logger.info('Starting Gemini API calls', { 
      maxRetries: API_CONFIG.AGENT_RETRY_COUNT,
      agentType: this.type
    });
    
    for (let i = 0; i < API_CONFIG.AGENT_RETRY_COUNT; i++) {
      const attemptStartTime = Date.now();
      
      try {
        logger.debug('Gemini API attempt started', { 
          attempt: i + 1,
          maxAttempts: API_CONFIG.AGENT_RETRY_COUNT
        });
        
        const request = {
          contents: [
            { role: 'user', parts: [{ text: userMessage }] }
          ],
          generationConfig: {
            maxOutputTokens: API_CONFIG.GEMINI_MAX_TOKENS,
            temperature: API_CONFIG.GEMINI_TEMPERATURE
          },
          systemInstruction: {
            parts: [{ text: this.systemPrompt }]
          }
        };

        const response = await client.sendMessage(request);

        // レスポンス構造の検証
        if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
          throw new Error('Invalid response structure from Gemini API');
        }

        const responseText = response.candidates[0].content.parts[0].text;
        
        logPerformance(logger, 'gemini_api_call', attemptStartTime, {
          attempt: i + 1,
          responseLength: responseText.length,
          success: true
        });
        
        logger.info('Gemini API call successful', { 
          attempt: i + 1,
          responseLength: responseText.length
        });
        
        return responseText;
        
      } catch (error) {
        lastError = error as Error;
        
        logError(logger, error, {
          attempt: i + 1,
          maxAttempts: API_CONFIG.AGENT_RETRY_COUNT,
          agentType: this.type
        });
        
        if (i < API_CONFIG.AGENT_RETRY_COUNT - 1) {
          logger.warn('Retrying Gemini API call', { 
            nextAttempt: i + 2,
            delayMs: API_CONFIG.AGENT_RETRY_DELAY
          });
          await delay(API_CONFIG.AGENT_RETRY_DELAY);
        }
      }
    }
    
    logger.error('All Gemini API attempts failed', { 
      totalAttempts: API_CONFIG.AGENT_RETRY_COUNT,
      agentType: this.type
    });
    
    throw lastError || new Error('Failed to call Gemini API after all retries');
  }
  
  protected extractJson(text: string, logger?: any): any {
    const log = logger || createAgentLogger('unknown', this.type, 'unknown');
    
    log.debug('Starting JSON extraction', { 
      responseLength: text.length,
      agentType: this.type
    });
    
    // 複数のJSONパターンを試行
    const patterns = [
      // Markdown形式のJSON
      /```json\s*([\s\S]*?)\s*```/,
      // プレーンJSONブロック
      /```\s*([\s\S]*?)\s*```/,
      // 中括弧で囲まれたJSON（最大のブロック）
      /(\{[\s\S]*\})/,
      // 角括弧で囲まれたJSON配列
      /(\[[\s\S]*\])/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const jsonStr = match[1].trim();
          const parsed = JSON.parse(jsonStr);
          log.info('JSON extraction successful', { 
            patternIndex: patterns.indexOf(pattern) + 1,
            jsonLength: jsonStr.length
          });
          return parsed;
        } catch (error) {
          log.debug('JSON pattern failed', { 
            patternIndex: patterns.indexOf(pattern) + 1,
            error: error instanceof Error ? error.message : String(error)
          });
          continue;
        }
      }
    }
    
    // 直接全文を解析
    try {
      const parsed = JSON.parse(text.trim());
      log.info('Direct JSON parsing successful');
      return parsed;
    } catch (error) {
      log.error('All JSON extraction patterns failed', {
        responsePreview: text.substring(0, 500),
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Failed to extract JSON from response: ${error}. Text preview: ${text.substring(0, 200)}...`);
    }
  }
}
