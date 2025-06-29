// Workflows API エンドポイントテスト

import { NextRequest } from 'next/server';
import { GET, POST } from '../workflows/route';

// Prismaクライアントのモック
const mockWorkflows = [
  {
    id: 'workflow-1',
    name: 'Test Workflow 1',
    status: 'completed',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    completedAt: new Date('2024-01-01'),
    agents: [
      {
        id: 'agent-1',
        workflowId: 'workflow-1',
        type: 'market_research',
        status: 'completed',
        input: '{"target":"health"}',
        output: '{"opportunities":[]}',
        error: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        completedAt: new Date('2024-01-01')
      }
    ]
  }
];

const mockPrisma = {
  workflow: {
    findMany: jest.fn().mockResolvedValue(mockWorkflows),
    create: jest.fn().mockImplementation((data) => Promise.resolve({
      id: 'new-workflow-123',
      name: data.data.name,
      status: data.data.status,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      agents: data.data.agents?.create || []
    }))
  }
};

jest.mock('../../lib/utils/db', () => ({
  __esModule: true,
  default: mockPrisma
}));

// 環境変数チェックのモック
jest.mock('../../lib/utils/env', () => ({
  assertEnvVars: jest.fn()
}));

// バリデーションスキーマのモック
jest.mock('../../lib/utils/validation', () => ({
  startWorkflowSchema: {
    parse: jest.fn().mockImplementation((data) => ({
      name: data.name || 'Default Workflow',
      initialInput: data.initialInput || {}
    }))
  }
}));

// エージェントシーケンスのモック
jest.mock('../../lib/agents', () => ({
  AGENT_SEQUENCE: ['market_research', 'content_scraping', 'nlp_classification'],
  AgentFactory: {
    create: jest.fn()
  }
}));

describe('/api/workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/workflows', () => {
    it('should return list of workflows', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(1);
      expect(data[0]).toHaveProperty('id', 'workflow-1');
      expect(data[0]).toHaveProperty('name', 'Test Workflow 1');
      expect(data[0]).toHaveProperty('agents');
      expect(data[0].agents).toHaveLength(1);
    });

    it('should include agents with correct structure', async () => {
      const response = await GET();
      const data = await response.json();

      const workflow = data[0];
      const agent = workflow.agents[0];

      expect(agent).toHaveProperty('id');
      expect(agent).toHaveProperty('type', 'market_research');
      expect(agent).toHaveProperty('status', 'completed');
      expect(agent).toHaveProperty('input');
      expect(agent).toHaveProperty('output');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.workflow.findMany.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Database connection failed');
    });

    it('should return workflows ordered by creation date (desc)', async () => {
      const multipleWorkflows = [
        { ...mockWorkflows[0], id: 'workflow-2', createdAt: new Date('2024-01-02') },
        { ...mockWorkflows[0], id: 'workflow-1', createdAt: new Date('2024-01-01') }
      ];
      
      mockPrisma.workflow.findMany.mockResolvedValueOnce(multipleWorkflows);

      const response = await GET();
      const data = await response.json();

      expect(data[0].id).toBe('workflow-2'); // 新しいものが先
      expect(data[1].id).toBe('workflow-1');
    });
  });

  describe('POST /api/workflows', () => {
    const createMockRequest = (body: any): NextRequest => {
      return {
        json: async () => body
      } as NextRequest;
    };

    it('should create new workflow successfully', async () => {
      const requestBody = {
        name: 'New Test Workflow',
        initialInput: { target: 'tech market' }
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id', 'new-workflow-123');
      expect(data).toHaveProperty('name', 'New Test Workflow');
      expect(data).toHaveProperty('status', 'pending');
      expect(mockPrisma.workflow.create).toHaveBeenCalled();
    });

    it('should create workflow with default name if not provided', async () => {
      const requestBody = {
        initialInput: { target: 'default market' }
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('name', 'Default Workflow');
    });

    it('should create agents for all sequences', async () => {
      const requestBody = {
        name: 'Full Workflow Test',
        initialInput: { target: 'comprehensive test' }
      };

      const request = createMockRequest(requestBody);
      await POST(request);

      const createCall = mockPrisma.workflow.create.mock.calls[0][0];
      expect(createCall.data.agents.create).toBeDefined();
      expect(createCall.data.agents.create).toHaveLength(3); // AGENT_SEQUENCEの長さ
    });

    it('should handle validation errors', async () => {
      const { startWorkflowSchema } = require('../../lib/utils/validation');
      startWorkflowSchema.parse.mockImplementationOnce(() => {
        throw new Error('Validation failed');
      });

      const requestBody = { invalidField: 'invalid' };
      const request = createMockRequest(requestBody);
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });

    it('should handle database creation errors', async () => {
      mockPrisma.workflow.create.mockRejectedValueOnce(new Error('Database write failed'));

      const requestBody = {
        name: 'Error Test Workflow',
        initialInput: { target: 'error test' }
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Database write failed');
    });

    it('should set initial input for first agent only', async () => {
      const requestBody = {
        name: 'Input Test Workflow',
        initialInput: { target: 'input test', category: 'health' }
      };

      const request = createMockRequest(requestBody);
      await POST(request);

      const createCall = mockPrisma.workflow.create.mock.calls[0][0];
      const agents = createCall.data.agents.create;

      // 最初のエージェントのみ入力データを持つ
      expect(agents[0].input).toBeDefined();
      expect(JSON.parse(agents[0].input)).toEqual(requestBody.initialInput);
      
      // 他のエージェントは入力なし
      expect(agents[1].input).toBeNull();
      expect(agents[2].input).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should return 500 for unexpected errors', async () => {
      mockPrisma.workflow.findMany.mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });

    it('should handle malformed request body', async () => {
      const request = {
        json: async () => {
          throw new Error('Malformed JSON');
        }
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });
});