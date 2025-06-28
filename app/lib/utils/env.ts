import { z } from 'zod'

// 環境変数スキーマ定義
const envSchema = z.object({
  // 必須環境変数
  GEMINI_API_KEY: z.string().min(1, 'Gemini API key is required'),
  
  // オプション環境変数（デフォルト値付き）
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().optional().default('file:./dev.db'),
  
  // ログ設定
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // API設定
  GEMINI_MAX_TOKENS: z.coerce.number().int().positive().default(8192),
  GEMINI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
  AGENT_RETRY_COUNT: z.coerce.number().int().positive().default(3),
  AGENT_RETRY_DELAY: z.coerce.number().int().positive().default(5000),
  AGENT_TIMEOUT: z.coerce.number().int().positive().default(300000), // 5分
  
  // レート制限設定
  GEMINI_RATE_LIMIT_REQUESTS: z.coerce.number().int().positive().default(10),
  GEMINI_RATE_LIMIT_WINDOW: z.coerce.number().int().positive().default(60000), // 1分
  
  // セキュリティ設定
  CORS_ORIGINS: z.string().optional(),
  API_SECRET: z.string().optional(),
  
  // フィーチャーフラグ
  ENABLE_DETAILED_LOGGING: z.coerce.boolean().default(false),
  ENABLE_PERFORMANCE_MONITORING: z.coerce.boolean().default(true),
})

// 型定義
export type Env = z.infer<typeof envSchema>

// パースされた環境変数
let parsedEnv: Env | null = null

// 環境変数の初期化と検証
export function initializeEnv(): Env {
  if (parsedEnv) {
    return parsedEnv
  }

  try {
    // 環境変数をパースして検証
    parsedEnv = envSchema.parse(process.env)
    
    // ログは循環依存を避けるためconsoleを使用
    console.log('Environment variables validated successfully', {
      nodeEnv: parsedEnv.NODE_ENV,
      logLevel: parsedEnv.LOG_LEVEL,
      enableDetailedLogging: parsedEnv.ENABLE_DETAILED_LOGGING,
      enablePerformanceMonitoring: parsedEnv.ENABLE_PERFORMANCE_MONITORING
    })
    
    return parsedEnv
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      const errorMessage = `Environment validation failed:\n${errorMessages.join('\n')}`
      
      console.error('Environment validation failed', {
        errors: error.errors,
        receivedEnv: Object.keys(process.env).filter(key => key.startsWith('GEMINI_') || key.startsWith('NODE_') || key.startsWith('DATABASE_'))
      })
      
      throw new Error(errorMessage)
    }
    
    console.error('Unexpected error during environment validation', { error })
    throw error
  }
}

// 環境変数取得関数（型安全）
export function getEnv(): Env {
  if (!parsedEnv) {
    return initializeEnv()
  }
  return parsedEnv
}

// 特定の環境変数を安全に取得
export function getEnvVar<K extends keyof Env>(key: K): Env[K] {
  const env = getEnv()
  return env[key]
}

// 開発環境かどうかの判定
export function isDevelopment(): boolean {
  return getEnvVar('NODE_ENV') === 'development'
}

// 本番環境かどうかの判定
export function isProduction(): boolean {
  return getEnvVar('NODE_ENV') === 'production'
}

// テスト環境かどうかの判定
export function isTest(): boolean {
  return getEnvVar('NODE_ENV') === 'test'
}

// レガシー関数（後方互換性のため）
export function assertEnvVars() {
  try {
    initializeEnv()
  } catch (error) {
    throw error
  }
}

// 環境設定の概要を取得（ログ用）
export function getEnvSummary() {
  const env = getEnv()
  return {
    nodeEnv: env.NODE_ENV,
    logLevel: env.LOG_LEVEL,
    hasGeminiKey: !!env.GEMINI_API_KEY,
    databaseUrl: env.DATABASE_URL,
    maxTokens: env.GEMINI_MAX_TOKENS,
    temperature: env.GEMINI_TEMPERATURE,
    retryCount: env.AGENT_RETRY_COUNT,
    timeout: env.AGENT_TIMEOUT,
    rateLimit: {
      requests: env.GEMINI_RATE_LIMIT_REQUESTS,
      window: env.GEMINI_RATE_LIMIT_WINDOW
    },
    features: {
      detailedLogging: env.ENABLE_DETAILED_LOGGING,
      performanceMonitoring: env.ENABLE_PERFORMANCE_MONITORING
    }
  }
}
