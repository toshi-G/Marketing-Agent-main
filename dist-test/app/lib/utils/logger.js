"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logApiResponse = exports.logPerformance = exports.logError = exports.createExternalApiLogger = exports.createDbLogger = exports.createApiLogger = exports.createAgentLogger = exports.createWorkflowLogger = exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
// ログレベルの設定
const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
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
    };
// メインロガーの作成
exports.logger = (0, pino_1.default)({
    level: logLevel,
    transport,
    formatters: {
        level: (label) => {
            return { level: label };
        }
    },
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
    serializers: {
        error: pino_1.default.stdSerializers.err,
        req: pino_1.default.stdSerializers.req,
        res: pino_1.default.stdSerializers.res
    }
});
// ワークフロー専用ロガー
const createWorkflowLogger = (workflowId) => {
    return exports.logger.child({
        module: 'workflow',
        workflowId
    });
};
exports.createWorkflowLogger = createWorkflowLogger;
// エージェント専用ロガー
const createAgentLogger = (workflowId, agentType, agentId) => {
    return exports.logger.child({
        module: 'agent',
        workflowId,
        agentType,
        agentId
    });
};
exports.createAgentLogger = createAgentLogger;
// API専用ロガー
const createApiLogger = (endpoint) => {
    return exports.logger.child({
        module: 'api',
        endpoint
    });
};
exports.createApiLogger = createApiLogger;
// データベース専用ロガー
const createDbLogger = () => {
    return exports.logger.child({
        module: 'database'
    });
};
exports.createDbLogger = createDbLogger;
// 外部API専用ロガー
const createExternalApiLogger = (service) => {
    return exports.logger.child({
        module: 'external-api',
        service
    });
};
exports.createExternalApiLogger = createExternalApiLogger;
// エラー情報を含む構造化ログ
const logError = (logger, error, context) => {
    const errorData = {
        error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
        } : error,
        ...context
    };
    logger.error(errorData, 'Error occurred');
};
exports.logError = logError;
// パフォーマンス測定用ログ
const logPerformance = (logger, operation, startTime, context) => {
    const duration = Date.now() - startTime;
    logger.info({
        operation,
        duration,
        ...context
    }, `Operation ${operation} completed in ${duration}ms`);
};
exports.logPerformance = logPerformance;
// APIレスポンス用ログ
const logApiResponse = (logger, method, url, statusCode, duration) => {
    logger.info({
        method,
        url,
        statusCode,
        duration
    }, `${method} ${url} - ${statusCode} in ${duration}ms`);
};
exports.logApiResponse = logApiResponse;
exports.default = exports.logger;
