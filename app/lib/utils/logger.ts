import pino from 'pino'

// ログレベルの設定
const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug'

// ログの出力設定
const transport = process.env.NODE_ENV === 'production' 
  ? undefined 
  : {
      target: 'pino-pretty',
      options: {
        colorize: true,
        levelFirst: true,
        translateTime: 'yyyy-mm-dd HH:MM:ss.l',
        ignore: 'pid,hostname'
      }
    }

// メインロガーの作成
export const logger = pino({
  level: logLevel,
  transport,
  formatters: {
    level: (label) => {
      return { level: label }
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  }
})

// ワークフロー専用ロガー
export const createWorkflowLogger = (workflowId: string) => {
  return logger.child({ 
    module: 'workflow',
    workflowId 
  })
}

// エージェント専用ロガー
export const createAgentLogger = (workflowId: string, agentType: string, agentId: string) => {
  return logger.child({ 
    module: 'agent',
    workflowId,
    agentType,
    agentId
  })
}

// API専用ロガー
export const createApiLogger = (endpoint: string) => {
  return logger.child({ 
    module: 'api',
    endpoint 
  })
}

// データベース専用ロガー
export const createDbLogger = () => {
  return logger.child({ 
    module: 'database'
  })
}

// 外部API専用ロガー
export const createExternalApiLogger = (service: string) => {
  return logger.child({ 
    module: 'external-api',
    service
  })
}

// エラー情報を含む構造化ログ
export const logError = (logger: pino.Logger, error: unknown, context?: Record<string, any>) => {
  const errorData = {
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    ...context
  }
  
  logger.error(errorData, 'Error occurred')
}

// パフォーマンス測定用ログ
export const logPerformance = (logger: pino.Logger, operation: string, startTime: number, context?: Record<string, any>) => {
  const duration = Date.now() - startTime
  logger.info({
    operation,
    duration,
    ...context
  }, `Operation ${operation} completed in ${duration}ms`)
}

// APIレスポンス用ログ
export const logApiResponse = (logger: pino.Logger, method: string, url: string, statusCode: number, duration: number) => {
  logger.info({
    method,
    url,
    statusCode,
    duration
  }, `${method} ${url} - ${statusCode} in ${duration}ms`)
}

export default logger