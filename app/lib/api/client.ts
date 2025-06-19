// APIクライアント

import { API_CONFIG } from './config';
import {
  GeminiRequest,
  GeminiResponse,
  WorkflowResponse,
  StartWorkflowRequest
} from './types';

// エラークラス
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Gemini APIクライアント
export class GeminiClient {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(request: GeminiRequest): Promise<GeminiResponse> {
    try {
      // デバッグログ
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Gemini API Request:', {
          url: `${API_CONFIG.GEMINI_API_URL}?key=${this.apiKey.substring(0, 10)}...`,
          contents: request.contents?.length ? `${request.contents.length} messages` : 'no contents',
          systemInstruction: request.systemInstruction ? 'present' : 'not provided'
        });
      }

      const response = await fetch(
        `${API_CONFIG.GEMINI_API_URL}?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Gemini API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        throw new APIError(
          `Gemini API error: ${response.statusText} (${response.status})`,
          response.status,
          errorData
        );
      }

      const data = await response.json();
      
      // レスポンス構造の検証
      if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
        throw new APIError('Invalid Gemini API response: no candidates found', 500, data);
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts)) {
        throw new APIError('Invalid Gemini API response: invalid candidate structure', 500, data);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Gemini API Response received:', {
          candidatesCount: data.candidates.length,
          partsCount: candidate.content.parts.length,
          firstPartLength: candidate.content.parts[0]?.text?.length || 0
        });
      }

      return data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error('❌ Gemini API Client Error:', error);
      throw new APIError(`Failed to call Gemini API: ${error instanceof Error ? error.message : error}`);
    }
  }
}

// ワークフローAPIクライアント
export class WorkflowClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }
  
  async startWorkflow(request: StartWorkflowRequest): Promise<WorkflowResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          `Failed to start workflow: ${response.statusText}`,
          response.status,
          errorData
        );
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Failed to start workflow: ${error}`);
    }
  }
  
  async getWorkflow(workflowId: string): Promise<WorkflowResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows/${workflowId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          `Failed to get workflow: ${response.statusText}`,
          response.status,
          errorData
        );
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Failed to get workflow: ${error}`);
    }
  }
  
  async listWorkflows(): Promise<WorkflowResponse[]> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          `Failed to list workflows: ${response.statusText}`,
          response.status,
          errorData
        );
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Failed to list workflows: ${error}`);
    }
  }
}

// シングルトンインスタンス
let geminiClient: GeminiClient | null = null;
let workflowClient: WorkflowClient | null = null;

export function getGeminiClient(): GeminiClient {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    geminiClient = new GeminiClient(apiKey);
  }
  return geminiClient;
}

export function getWorkflowClient(): WorkflowClient {
  if (!workflowClient) {
    workflowClient = new WorkflowClient();
  }
  return workflowClient;
}
