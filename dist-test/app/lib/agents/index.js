"use strict";
// エージェントファクトリー
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_SEQUENCE = exports.AgentFactory = void 0;
const types_1 = require("../api/types");
const market_research_1 = require("./market-research");
const content_scraping_1 = require("./content-scraping");
const nlp_classification_1 = require("./nlp-classification");
const template_optimization_1 = require("./template-optimization");
const business_strategy_1 = require("./business-strategy");
const content_creation_1 = require("./content-creation");
const copy_generation_1 = require("./copy-generation");
const optimization_archive_1 = require("./optimization-archive");
class AgentFactory {
    static create(type) {
        switch (type) {
            case types_1.AgentType.MARKET_RESEARCH:
                return new market_research_1.MarketResearchAgent();
            case types_1.AgentType.CONTENT_SCRAPING:
                return new content_scraping_1.ContentScrapingAgent();
            case types_1.AgentType.NLP_CLASSIFICATION:
                return new nlp_classification_1.NLPClassificationAgent();
            case types_1.AgentType.TEMPLATE_OPTIMIZATION:
                return new template_optimization_1.TemplateOptimizationAgent();
            case types_1.AgentType.BUSINESS_STRATEGY:
                return new business_strategy_1.BusinessStrategyAgent();
            case types_1.AgentType.CONTENT_CREATION:
                return new content_creation_1.ContentCreationAgent();
            case types_1.AgentType.COPY_GENERATION:
                return new copy_generation_1.CopyGenerationAgent();
            case types_1.AgentType.OPTIMIZATION_ARCHIVE:
                return new optimization_archive_1.OptimizationArchiveAgent();
            default:
                throw new Error(`Unknown agent type: ${type}`);
        }
    }
}
exports.AgentFactory = AgentFactory;
// エージェントの実行順序
exports.AGENT_SEQUENCE = [
    types_1.AgentType.MARKET_RESEARCH,
    types_1.AgentType.CONTENT_SCRAPING,
    types_1.AgentType.NLP_CLASSIFICATION,
    types_1.AgentType.TEMPLATE_OPTIMIZATION,
    types_1.AgentType.BUSINESS_STRATEGY,
    types_1.AgentType.CONTENT_CREATION,
    types_1.AgentType.COPY_GENERATION,
    types_1.AgentType.OPTIMIZATION_ARCHIVE
];
