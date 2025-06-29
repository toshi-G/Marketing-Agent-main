// 構造化ロギングシステム

import pino from 'pino';
import { getEnvVar, isDevelopment } from './env';

// ログレベルの定義
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// ログコンテキストの型定義
export interface LogContext {
  workflowId?: string;
  agentId?: string;
  agentType?: string;
  userId?: string;
  requestId?: string;
  traceId?: string;
  sessionId?: string;
  [key: string]: any;
}

// ログメタデータの型定義
export interface LogMetadata {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  performance?: {
    duration: number;
    memory?: number;
  };
  request?: {
    method: string;
    url: string;
    userAgent?: string;
    ip?: string;
  };
}

// Pinoロガーの設定
const createPinoLogger = () => {
  const isDev = isDevelopment();
  
  return pino({
    level: getEnvVar('LOG_LEVEL'),
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(isDev && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    }),
  });
};

// 構造化ロガークラス
export class StructuredLogger {
  private pinoLogger: pino.Logger;
  private context: LogContext;

  constructor(baseContext: LogContext = {}) {
    this.pinoLogger = createPinoLogger();
    this.context = baseContext;
  }

  // コンテキストを追加/更新
  setContext(context: Partial<LogContext>): StructuredLogger {
    return new StructuredLogger({ ...this.context, ...context });
  }

  // コンテキストをクリア
  clearContext(): StructuredLogger {
    return new StructuredLogger();
  }

  // 基本ログメソッド
  private log(level: LogLevel, message: string, metadata: Partial<LogMetadata> = {}) {
    const logData: LogMetadata = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...metadata.context },
      ...metadata,
    };

    this.pinoLogger[level](logData, message);
  }

  // レベル別ログメソッド
  debug(message: string, metadata?: Partial<LogMetadata>) {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Partial<LogMetadata>) {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Partial<LogMetadata>) {
    this.log('warn', message, metadata);
  }

  error(message: string, error?: Error, metadata?: Partial<LogMetadata>) {
    const errorMetadata = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    } : {};

    this.log('error', message, { ...metadata, ...errorMetadata });
  }

  fatal(message: string, error?: Error, metadata?: Partial<LogMetadata>) {
    const errorMetadata = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    } : {};

    this.log('fatal', message, { ...metadata, ...errorMetadata });
  }

  // パフォーマンスログ
  performance(message: string, duration: number, metadata?: Partial<LogMetadata>) {
    this.log('info', message, {
      ...metadata,
      performance: {
        duration,
        memory: process.memoryUsage().heapUsed,
      },
    });
  }

  // AIエージェント専用ログメソッド
  agentStart(agentType: string, workflowId: string, agentId: string, input: any) {
    this.setContext({ workflowId, agentId, agentType }).info(
      `Agent ${agentType} started`,
      {
        context: { 
          phase: 'start',
          inputKeys: Object.keys(input || {}),
          inputSize: JSON.stringify(input || {}).length,
        },
      }
    );
  }

  agentProgress(agentType: string, step: string, progress?: number) {
    this.info(`Agent ${agentType} progress: ${step}`, {
      context: { 
        phase: 'progress', 
        step,
        ...(progress !== undefined && { progress }),
      },
    });
  }

  agentComplete(agentType: string, duration: number, output: any) {
    this.performance(
      `Agent ${agentType} completed`,
      duration,
      {
        context: { 
          phase: 'complete',
          outputKeys: Object.keys(output || {}),
          outputSize: JSON.stringify(output || {}).length,
        },
      }
    );
  }

  agentError(agentType: string, error: Error, duration?: number) {
    this.error(
      `Agent ${agentType} failed`,
      error,
      {
        context: { 
          phase: 'error',
          ...(duration !== undefined && { duration }),
        },
      }
    );
  }

  // ワークフロー専用ログメソッド
  workflowStart(workflowId: string, name: string, agentCount: number) {
    this.setContext({ workflowId }).info(
      'Workflow started',
      {
        context: { 
          workflowName: name,
          agentCount,
          phase: 'start',
        },
      }
    );
  }

  workflowComplete(workflowId: string, duration: number, agentResults: number) {
    this.performance(
      'Workflow completed',
      duration,
      {
        context: { 
          workflowId,
          agentResults,
          phase: 'complete',
        },
      }
    );
  }

  workflowError(workflowId: string, error: Error, failedAgent?: string) {
    this.error(
      'Workflow failed',
      error,
      {
        context: { 
          workflowId,
          failedAgent,
          phase: 'error',
        },
      }
    );
  }

  // APIリクエスト用ログメソッド
  requestStart(method: string, url: string, userAgent?: string, ip?: string) {
    this.info('API request started', {
      request: { method, url, userAgent, ip },
      context: { phase: 'request_start' },
    });
  }

  requestComplete(method: string, url: string, statusCode: number, duration: number) {
    this.performance('API request completed', duration, {
      request: { method, url },
      context: { 
        statusCode,
        phase: 'request_complete',
      },
    });
  }

  requestError(method: string, url: string, error: Error, statusCode?: number) {
    this.error('API request failed', error, {
      request: { method, url },
      context: { 
        statusCode,
        phase: 'request_error',
      },
    });
  }

  // データベース操作用ログメソッド
  dbQuery(operation: string, table: string, duration: number, recordCount?: number) {
    this.performance(`Database ${operation}`, duration, {
      context: { 
        operation,
        table,
        recordCount,
        phase: 'db_query',
      },
    });
  }

  dbError(operation: string, table: string, error: Error) {
    this.error(`Database ${operation} failed`, error, {
      context: { 
        operation,
        table,
        phase: 'db_error',
      },
    });
  }
}

// デフォルトロガーインスタンス
export const logger = new StructuredLogger();

// 便利な関数エクスポート
export const createLogger = (context: LogContext) => new StructuredLogger(context);

// パフォーマンス測定用デコレータ
export function logPerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const startTime = Date.now();
    const logger = new StructuredLogger({ 
      method: `${target.constructor.name}.${propertyName}`,
    });

    logger.debug(`Method ${propertyName} started`);

    try {
      const result = await method.apply(this, args);
      const duration = Date.now() - startTime;
      
      logger.performance(`Method ${propertyName} completed`, duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(
        `Method ${propertyName} failed`,
        error instanceof Error ? error : new Error(String(error)),
        { performance: { duration } }
      );
      
      throw error;
    }
  };

  return descriptor;
}