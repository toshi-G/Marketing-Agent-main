// エージェント基底クラス

import { getGeminiClient } from '../api/client';
import { API_CONFIG, AGENT_PROMPTS } from '../api/config';
import { AgentType, WorkflowStatus } from '../api/types';
import prisma from '../utils/db';
import { delay, getErrorMessage } from '../utils';

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
    
    try {
      // ステータスを実行中に更新
      await prisma.agent.update({
        where: { id: agentId },
        data: { status: WorkflowStatus.RUNNING }
      });
      
      // 入力をフォーマット
      const userMessage = this.formatInput(context);
      
      // Gemini APIを呼び出し
      const geminiClient = getGeminiClient();
      const response = await this.callGeminiWithRetry(geminiClient, userMessage);
      
      // 出力をパース
      const output = this.parseOutput(response);
      
      // 出力を検証
      if (!this.validateOutput(output)) {
        throw new Error('Invalid output format');
      }
      
      // 結果を保存
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          status: WorkflowStatus.COMPLETED,
          output: JSON.stringify(output),
          completedAt: new Date()
        }
      });
      
      return output;
      
    } catch (error) {
      // エラーを記録
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          status: WorkflowStatus.FAILED,
          error: getErrorMessage(error),
          completedAt: new Date()
        }
      });
      
      throw error;
    }
  }
  
  private async callGeminiWithRetry(
    client: any,
    userMessage: string
  ): Promise<string> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < API_CONFIG.AGENT_RETRY_COUNT; i++) {
      try {
        const response = await client.sendMessage({
          contents: [
            { role: 'user', parts: [{ text: userMessage }] }
          ],
          generationConfig: {
            maxOutputTokens: API_CONFIG.GEMINI_MAX_TOKENS,
            temperature: API_CONFIG.GEMINI_TEMPERATURE
          },
          systemInstruction: this.systemPrompt
        });

        return response.candidates[0].content.parts[0].text;
        
      } catch (error) {
        lastError = error as Error;
        if (i < API_CONFIG.AGENT_RETRY_COUNT - 1) {
          await delay(API_CONFIG.AGENT_RETRY_DELAY);
        }
      }
    }
    
    throw lastError || new Error('Failed to call Gemini API');
  }
  
  protected extractJson(text: string): any {
    // JSON部分を抽出
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (error) {
        throw new Error(`Failed to parse JSON: ${error}`);
      }
    }
    
    // 直接JSONとして解析を試みる
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('No valid JSON found in response');
    }
  }
}
