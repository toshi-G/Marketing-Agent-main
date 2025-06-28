"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeEnv = initializeEnv;
exports.getEnv = getEnv;
exports.getEnvVar = getEnvVar;
exports.isDevelopment = isDevelopment;
exports.isProduction = isProduction;
exports.isTest = isTest;
exports.assertEnvVars = assertEnvVars;
exports.getEnvSummary = getEnvSummary;
const zod_1 = require("zod");
// 環境変数スキーマ定義
const envSchema = zod_1.z.object({
    // 必須環境変数
    GEMINI_API_KEY: zod_1.z.string().min(1, 'Gemini API key is required'),
    // オプション環境変数（デフォルト値付き）
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: zod_1.z.string().optional().default('file:./dev.db'),
    // ログ設定
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    // API設定
    GEMINI_MAX_TOKENS: zod_1.z.coerce.number().int().positive().default(8192),
    GEMINI_TEMPERATURE: zod_1.z.coerce.number().min(0).max(2).default(0.7),
    AGENT_RETRY_COUNT: zod_1.z.coerce.number().int().positive().default(3),
    AGENT_RETRY_DELAY: zod_1.z.coerce.number().int().positive().default(5000),
    AGENT_TIMEOUT: zod_1.z.coerce.number().int().positive().default(300000), // 5分
    // レート制限設定
    GEMINI_RATE_LIMIT_REQUESTS: zod_1.z.coerce.number().int().positive().default(10),
    GEMINI_RATE_LIMIT_WINDOW: zod_1.z.coerce.number().int().positive().default(60000), // 1分
    // セキュリティ設定
    CORS_ORIGINS: zod_1.z.string().optional(),
    API_SECRET: zod_1.z.string().optional(),
    // フィーチャーフラグ
    ENABLE_DETAILED_LOGGING: zod_1.z.coerce.boolean().default(false),
    ENABLE_PERFORMANCE_MONITORING: zod_1.z.coerce.boolean().default(true),
});
// パースされた環境変数
let parsedEnv = null;
// 環境変数の初期化と検証
function initializeEnv() {
    if (parsedEnv) {
        return parsedEnv;
    }
    try {
        // 環境変数をパースして検証
        parsedEnv = envSchema.parse(process.env);
        // ログは循環依存を避けるためconsoleを使用
        console.log('Environment variables validated successfully', {
            nodeEnv: parsedEnv.NODE_ENV,
            logLevel: parsedEnv.LOG_LEVEL,
            enableDetailedLogging: parsedEnv.ENABLE_DETAILED_LOGGING,
            enablePerformanceMonitoring: parsedEnv.ENABLE_PERFORMANCE_MONITORING
        });
        return parsedEnv;
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
            const errorMessage = `Environment validation failed:\n${errorMessages.join('\n')}`;
            console.error('Environment validation failed', {
                errors: error.errors,
                receivedEnv: Object.keys(process.env).filter(key => key.startsWith('GEMINI_') || key.startsWith('NODE_') || key.startsWith('DATABASE_'))
            });
            throw new Error(errorMessage);
        }
        console.error('Unexpected error during environment validation', { error });
        throw error;
    }
}
// 環境変数取得関数（型安全）
function getEnv() {
    if (!parsedEnv) {
        return initializeEnv();
    }
    return parsedEnv;
}
// 特定の環境変数を安全に取得
function getEnvVar(key) {
    const env = getEnv();
    return env[key];
}
// 開発環境かどうかの判定
function isDevelopment() {
    return getEnvVar('NODE_ENV') === 'development';
}
// 本番環境かどうかの判定
function isProduction() {
    return getEnvVar('NODE_ENV') === 'production';
}
// テスト環境かどうかの判定
function isTest() {
    return getEnvVar('NODE_ENV') === 'test';
}
// レガシー関数（後方互換性のため）
function assertEnvVars() {
    try {
        initializeEnv();
    }
    catch (error) {
        throw error;
    }
}
// 環境設定の概要を取得（ログ用）
function getEnvSummary() {
    const env = getEnv();
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
    };
}
