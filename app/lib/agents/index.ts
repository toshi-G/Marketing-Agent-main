// エージェントファクトリー

import { AgentType } from '../api/types';
import { BaseAgent } from './base';
import { MarketResearchAgent } from './market-research';
import { ContentScrapingAgent } from './content-scraping';
import { NLPClassificationAgent } from './nlp-classification';
import { TemplateOptimizationAgent } from './template-optimization';
import { BusinessStrategyAgent } from './business-strategy';
import { ContentCreationAgent } from './content-creation';
import { CopyGenerationAgent } from './copy-generation';
import { OptimizationArchiveAgent } from './optimization-archive';

export class AgentFactory {
  static create(type: AgentType): BaseAgent {
    switch (type) {
      case AgentType.MARKET_RESEARCH:
        return new MarketResearchAgent();
      
      case AgentType.CONTENT_SCRAPING:
        return new ContentScrapingAgent();
      
      case AgentType.NLP_CLASSIFICATION:
        return new NLPClassificationAgent();
      
      case AgentType.TEMPLATE_OPTIMIZATION:
        return new TemplateOptimizationAgent();
      
      case AgentType.BUSINESS_STRATEGY:
        return new BusinessStrategyAgent();
      
      case AgentType.CONTENT_CREATION:
        return new ContentCreationAgent();
      
      case AgentType.COPY_GENERATION:
        return new CopyGenerationAgent();
      
      case AgentType.OPTIMIZATION_ARCHIVE:
        return new OptimizationArchiveAgent();
      
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }
}

// エージェントの実行順序
export const AGENT_SEQUENCE: AgentType[] = [
  AgentType.MARKET_RESEARCH,
  AgentType.CONTENT_SCRAPING,
  AgentType.NLP_CLASSIFICATION,
  AgentType.TEMPLATE_OPTIMIZATION,
  AgentType.BUSINESS_STRATEGY,
  AgentType.CONTENT_CREATION,
  AgentType.COPY_GENERATION,
  AgentType.OPTIMIZATION_ARCHIVE
];
