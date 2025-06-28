"use strict";
// API関連の型定義
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowStatus = exports.AgentType = void 0;
// エージェントタイプ
var AgentType;
(function (AgentType) {
    AgentType["MARKET_RESEARCH"] = "market_research";
    AgentType["CONTENT_SCRAPING"] = "content_scraping";
    AgentType["NLP_CLASSIFICATION"] = "nlp_classification";
    AgentType["TEMPLATE_OPTIMIZATION"] = "template_optimization";
    AgentType["BUSINESS_STRATEGY"] = "business_strategy";
    AgentType["CONTENT_CREATION"] = "content_creation";
    AgentType["COPY_GENERATION"] = "copy_generation";
    AgentType["OPTIMIZATION_ARCHIVE"] = "optimization_archive";
})(AgentType || (exports.AgentType = AgentType = {}));
// ワークフローステータス
var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["PENDING"] = "pending";
    WorkflowStatus["RUNNING"] = "running";
    WorkflowStatus["COMPLETED"] = "completed";
    WorkflowStatus["FAILED"] = "failed";
})(WorkflowStatus || (exports.WorkflowStatus = WorkflowStatus = {}));
