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
    
    console.log(`🔄 ${this.type} エージェント開始: Gemini API呼び出し (最大${API_CONFIG.AGENT_RETRY_COUNT}回試行)`);
    
    for (let i = 0; i < API_CONFIG.AGENT_RETRY_COUNT; i++) {
      try {
        console.log(`📡 試行 ${i + 1}/${API_CONFIG.AGENT_RETRY_COUNT}: ${this.type}`);
        
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
        console.log(`✅ ${this.type} 成功: レスポンス長 ${responseText.length}文字`);
        
        return responseText;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ ${this.type} 試行 ${i + 1} 失敗:`, error instanceof Error ? error.message : error);
        
        if (i < API_CONFIG.AGENT_RETRY_COUNT - 1) {
          console.log(`⏳ ${API_CONFIG.AGENT_RETRY_DELAY/1000}秒待機後、再試行...`);
          await delay(API_CONFIG.AGENT_RETRY_DELAY);
        }
      }
    }
    
    console.error(`💥 ${this.type} 全試行失敗`);
    throw lastError || new Error('Failed to call Gemini API after all retries');
  }
  
  protected extractJson(text: string): any {
    console.log(`🔍 ${this.type} JSON抽出開始: レスポンス長 ${text.length}文字`);
    
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
          console.log(`✅ ${this.type} JSON解析成功: パターン ${patterns.indexOf(pattern) + 1}`);
          return parsed;
        } catch (error) {
          console.log(`❌ ${this.type} JSON解析失敗: パターン ${patterns.indexOf(pattern) + 1} - ${error}`);
          continue;
        }
      }
    }
    
    // 直接全文を解析
    try {
      const parsed = JSON.parse(text.trim());
      console.log(`✅ ${this.type} 直接JSON解析成功`);
      return parsed;
    } catch (error) {
      console.error(`❌ ${this.type} 全JSONパターン失敗`);
      console.error('応答テキスト（最初の500文字）:', text.substring(0, 500));
      throw new Error(`Failed to extract JSON from response: ${error}. Text preview: ${text.substring(0, 200)}...`);
    }
  }
}
