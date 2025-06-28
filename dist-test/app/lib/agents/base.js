"use strict";
// エージェント基底クラス
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
const client_1 = require("../api/client");
const config_1 = require("../api/config");
const types_1 = require("../api/types");
const db_1 = __importDefault(require("../utils/db"));
const utils_1 = require("../utils");
const logger_1 = require("../utils/logger");
class BaseAgent {
    constructor(type) {
        this.type = type;
        this.systemPrompt = config_1.AGENT_PROMPTS[type];
    }
    async execute(context) {
        const { workflowId, agentId } = context;
        const logger = (0, logger_1.createAgentLogger)(workflowId, this.type, agentId);
        const startTime = Date.now();
        logger.info('Agent execution started', {
            agentType: this.type,
            inputSize: JSON.stringify(context.input).length,
            previousOutputsCount: context.previousOutputs.size
        });
        try {
            // ステータスを実行中に更新
            await db_1.default.agent.update({
                where: { id: agentId },
                data: { status: types_1.WorkflowStatus.RUNNING }
            });
            logger.info('Agent status updated to running');
            // 入力をフォーマット
            const userMessage = this.formatInput(context);
            logger.debug('Input formatted', { inputLength: userMessage.length });
            // Gemini APIを呼び出し
            const geminiClient = (0, client_1.getGeminiClient)();
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
            await db_1.default.agent.update({
                where: { id: agentId },
                data: {
                    status: types_1.WorkflowStatus.COMPLETED,
                    output: JSON.stringify(output),
                    completedAt: new Date()
                }
            });
            (0, logger_1.logPerformance)(logger, 'agent_execution', startTime, {
                agentType: this.type,
                success: true
            });
            logger.info('Agent execution completed successfully');
            return output;
        }
        catch (error) {
            (0, logger_1.logError)(logger, error, {
                agentType: this.type,
                workflowId,
                agentId
            });
            // エラーを記録
            await db_1.default.agent.update({
                where: { id: agentId },
                data: {
                    status: types_1.WorkflowStatus.FAILED,
                    error: (0, utils_1.getErrorMessage)(error),
                    completedAt: new Date()
                }
            });
            (0, logger_1.logPerformance)(logger, 'agent_execution', startTime, {
                agentType: this.type,
                success: false
            });
            throw error;
        }
    }
    async callGeminiWithRetry(client, userMessage, logger) {
        let lastError = null;
        logger.info('Starting Gemini API calls', {
            maxRetries: config_1.API_CONFIG.AGENT_RETRY_COUNT,
            agentType: this.type
        });
        for (let i = 0; i < config_1.API_CONFIG.AGENT_RETRY_COUNT; i++) {
            const attemptStartTime = Date.now();
            try {
                logger.debug('Gemini API attempt started', {
                    attempt: i + 1,
                    maxAttempts: config_1.API_CONFIG.AGENT_RETRY_COUNT
                });
                const request = {
                    contents: [
                        { role: 'user', parts: [{ text: userMessage }] }
                    ],
                    generationConfig: {
                        maxOutputTokens: config_1.API_CONFIG.GEMINI_MAX_TOKENS,
                        temperature: config_1.API_CONFIG.GEMINI_TEMPERATURE
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
                (0, logger_1.logPerformance)(logger, 'gemini_api_call', attemptStartTime, {
                    attempt: i + 1,
                    responseLength: responseText.length,
                    success: true
                });
                logger.info('Gemini API call successful', {
                    attempt: i + 1,
                    responseLength: responseText.length
                });
                return responseText;
            }
            catch (error) {
                lastError = error;
                (0, logger_1.logError)(logger, error, {
                    attempt: i + 1,
                    maxAttempts: config_1.API_CONFIG.AGENT_RETRY_COUNT,
                    agentType: this.type
                });
                if (i < config_1.API_CONFIG.AGENT_RETRY_COUNT - 1) {
                    logger.warn('Retrying Gemini API call', {
                        nextAttempt: i + 2,
                        delayMs: config_1.API_CONFIG.AGENT_RETRY_DELAY
                    });
                    await (0, utils_1.delay)(config_1.API_CONFIG.AGENT_RETRY_DELAY);
                }
            }
        }
        logger.error('All Gemini API attempts failed', {
            totalAttempts: config_1.API_CONFIG.AGENT_RETRY_COUNT,
            agentType: this.type
        });
        throw lastError || new Error('Failed to call Gemini API after all retries');
    }
    extractJson(text, logger) {
        const log = logger || (0, logger_1.createAgentLogger)('unknown', this.type, 'unknown');
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
                }
                catch (error) {
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
        }
        catch (error) {
            log.error('All JSON extraction patterns failed', {
                responsePreview: text.substring(0, 500),
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error(`Failed to extract JSON from response: ${error}. Text preview: ${text.substring(0, 200)}...`);
        }
    }
}
exports.BaseAgent = BaseAgent;
