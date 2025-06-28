import { MarketResearchAgent } from '../market-research';
import { AgentType } from '../../api/types';

describe('MarketResearchAgent', () => {
  let agent: MarketResearchAgent;

  beforeEach(() => {
    agent = new MarketResearchAgent();
  });

  describe('formatInput', () => {
    it('should format input with target genre and keywords', () => {
      const context = {
        workflowId: 'wf1',
        agentId: 'ag1',
        input: {
          targetGenre: 'オンライン教育',
          keywords: ['プログラミング', 'AI', '資格'],
        },
        previousOutputs: new Map(),
      };
      const formattedInput = agent.formatInput(context);
      expect(formattedInput).toContain('対象分野: オンライン教育');
      expect(formattedInput).toContain('関連キーワード: プログラミング, AI, 資格');
      expect(formattedInput).toContain('市場調査を実施し、収益性の高いマーケティングジャンルを特定してください。');
      expect(formattedInput).toContain('出力は以下のJSON形式でお願いします：');
    });

    it('should format input with only target genre', () => {
      const context = {
        workflowId: 'wf1',
        agentId: 'ag1',
        input: {
          targetGenre: 'フィットネス',
        },
        previousOutputs: new Map(),
      };
      const formattedInput = agent.formatInput(context);
      expect(formattedInput).toContain('対象分野: フィットネス');
      expect(formattedInput).not.toContain('関連キーワード:');
    });

    it('should format input with only keywords', () => {
      const context = {
        workflowId: 'wf1',
        agentId: 'ag1',
        input: {
          keywords: ['健康', 'ダイエット'],
        },
        previousOutputs: new Map(),
      };
      const formattedInput = agent.formatInput(context);
      expect(formattedInput).not.toContain('対象分野:');
      expect(formattedInput).toContain('関連キーワード: 健康, ダイエット');
    });

    it('should format input without target genre or keywords', () => {
      const context = {
        workflowId: 'wf1',
        agentId: 'ag1',
        input: {},
        previousOutputs: new Map(),
      };
      const formattedInput = agent.formatInput(context);
      expect(formattedInput).not.toContain('対象分野:');
      expect(formattedInput).not.toContain('関連キーワード:');
      expect(formattedInput).toContain('市場調査を実施し、収益性の高いマーケティングジャンルを特定してください。');
    });
  });

  describe('validateOutput', () => {
    it('should return true for valid output', () => {
      const validOutput = {
        recommended_genres: [
          {
            genre: 'オンライン教育',
            trend_score: 85,
            profitability_score: 92,
            competition_level: 'medium',
            market_size: '100億円',
            target_audience: '30-40代女性',
            reason: '需要が高く、オンラインでの学習ニーズが増加しているため。',
            keywords: ['プログラミング', 'AI'],
          },
        ],
        analysis_summary: '市場は成長しており、特にオンライン教育分野が有望です。',
      };
      expect(agent.validateOutput(validOutput)).toBe(true);
    });

    it('should return false for invalid output (missing recommended_genres)', () => {
      const invalidOutput = {
        analysis_summary: '市場は成長しており、特にオンライン教育分野が有望です。',
      };
      expect(agent.validateOutput(invalidOutput)).toBe(false);
    });

    it('should return false for invalid output (recommended_genres not array)', () => {
      const invalidOutput = {
        recommended_genres: 'not an array',
        analysis_summary: '市場は成長しており、特にオンライン教育分野が有望です。',
      };
      expect(agent.validateOutput(invalidOutput)).toBe(false);
    });

    it('should return false for invalid output (missing analysis_summary)', () => {
      const invalidOutput = {
        recommended_genres: [
          {
            genre: 'オンライン教育',
            trend_score: 85,
            profitability_score: 92,
            competition_level: 'medium',
            market_size: '100億円',
            target_audience: '30-40代女性',
            reason: '需要が高く、オンラインでの学習ニーズが増加しているため。',
            keywords: ['プログラミング', 'AI'],
          },
        ],
      };
      expect(agent.validateOutput(invalidOutput)).toBe(false);
    });

    it('should return false for invalid output (invalid genre type)', () => {
      const invalidOutput = {
        recommended_genres: [
          {
            genre: 123, // Invalid type
            trend_score: 85,
            profitability_score: 92,
            competition_level: 'medium',
            market_size: '100億円',
            target_audience: '30-40代女性',
            reason: '需要が高く、オンラインでの学習ニーズが増加しているため。',
            keywords: ['プログラミング', 'AI'],
          },
        ],
        analysis_summary: '市場は成長しており、特にオンライン教育分野が有望です。',
      };
      expect(agent.validateOutput(invalidOutput)).toBe(false);
    });

    it('should return false for invalid output (invalid trend_score type)', () => {
      const invalidOutput = {
        recommended_genres: [
          {
            genre: 'オンライン教育',
            trend_score: 'eighty five', // Invalid type
            profitability_score: 92,
            competition_level: 'medium',
            market_size: '100億円',
            target_audience: '30-40代女性',
            reason: '需要が高く、オンラインでの学習ニーズが増加しているため。',
            keywords: ['プログラミング', 'AI'],
          },
        ],
        analysis_summary: '市場は成長しており、特にオンライン教育分野が有望です。',
      };
      expect(agent.validateOutput(invalidOutput)).toBe(false);
    });
  });
});
