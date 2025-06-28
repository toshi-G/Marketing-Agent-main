"use strict";
/**
 * Core AI Agent Test Implementation
 *
 * This file contains the actual test logic for testing AI agent functionality.
 * It's compiled to JavaScript and executed by the main test script.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAllTests = runAllTests;
const dotenv = __importStar(require("dotenv"));
const client_1 = require("@prisma/client");
// Load environment variables
dotenv.config();
/**
 * Test 1: Environment Variable Validation
 */
async function testEnvironmentVariables(logTest) {
    try {
        // Check if GEMINI_API_KEY is present
        if (!process.env.GEMINI_API_KEY) {
            logTest('Environment Variables - GEMINI_API_KEY', 'FAIL', 'GEMINI_API_KEY is not set');
            return;
        }
        // Validate API key format (should start with AIza and be at least 35 characters)
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey.startsWith('AIza') || apiKey.length < 35) {
            logTest('Environment Variables - API Key Format', 'FAIL', 'Invalid GEMINI_API_KEY format');
            return;
        }
        logTest('Environment Variables - GEMINI_API_KEY', 'PASS', `API key present and valid format`);
        // Test environment utility functions
        const { initializeEnv, getEnvVar } = await Promise.resolve().then(() => __importStar(require('./app/lib/utils/env')));
        const env = initializeEnv();
        const maxTokens = getEnvVar('GEMINI_MAX_TOKENS');
        const temperature = getEnvVar('GEMINI_TEMPERATURE');
        const retryCount = getEnvVar('AGENT_RETRY_COUNT');
        logTest('Environment Variables - Utility Functions', 'PASS', `Max tokens: ${maxTokens}, Temperature: ${temperature}, Retry count: ${retryCount}`);
    }
    catch (error) {
        logTest('Environment Variables', 'FAIL', `Error: ${error.message}`);
    }
}
/**
 * Test 2: Gemini API Client Basic Functionality
 */
async function testGeminiApiClient(logTest) {
    try {
        const { GeminiClient, getGeminiClient } = await Promise.resolve().then(() => __importStar(require('./app/lib/api/client')));
        // Test singleton client creation
        const client1 = getGeminiClient();
        const client2 = getGeminiClient();
        if (client1 === client2) {
            logTest('Gemini Client - Singleton Pattern', 'PASS', 'Client instances are properly cached');
        }
        else {
            logTest('Gemini Client - Singleton Pattern', 'FAIL', 'Multiple client instances created');
            return;
        }
        // Test client structure
        if (typeof client1.sendMessage === 'function') {
            logTest('Gemini Client - Structure', 'PASS', 'Client has required sendMessage method');
        }
        else {
            logTest('Gemini Client - Structure', 'FAIL', 'Client missing sendMessage method');
            return;
        }
        // Test API call (with a simple request)
        const simpleRequest = {
            contents: [
                { role: 'user', parts: [{ text: 'Hello, respond with just "OK"' }] }
            ],
            generationConfig: {
                maxOutputTokens: 100,
                temperature: 0.1
            }
        };
        try {
            const response = await client1.sendMessage(simpleRequest);
            if (response && response.candidates && response.candidates.length > 0) {
                const responseText = response.candidates[0].content.parts[0].text;
                logTest('Gemini API - Basic Call', 'PASS', `Response received: "${responseText.substring(0, 50)}..."`);
            }
            else {
                logTest('Gemini API - Basic Call', 'FAIL', 'Invalid response structure');
            }
        }
        catch (apiError) {
            logTest('Gemini API - Basic Call', 'FAIL', `API call failed: ${apiError.message}`);
        }
    }
    catch (error) {
        logTest('Gemini API Client', 'FAIL', `Error: ${error.message}`);
    }
}
/**
 * Test 3: Agent Factory Pattern
 */
async function testAgentFactory(logTest) {
    try {
        const { AgentFactory } = await Promise.resolve().then(() => __importStar(require('./app/lib/agents')));
        const { AgentType } = await Promise.resolve().then(() => __importStar(require('./app/lib/api/types')));
        // Test creating different agent types
        const marketResearchAgent = AgentFactory.create(AgentType.MARKET_RESEARCH);
        const contentScrapingAgent = AgentFactory.create(AgentType.CONTENT_SCRAPING);
        if (marketResearchAgent && contentScrapingAgent) {
            logTest('Agent Factory - Creation', 'PASS', 'Successfully created different agent types');
        }
        else {
            logTest('Agent Factory - Creation', 'FAIL', 'Failed to create agents');
            return;
        }
        // Test agent sequence
        const { AGENT_SEQUENCE } = await Promise.resolve().then(() => __importStar(require('./app/lib/agents')));
        if (Array.isArray(AGENT_SEQUENCE) && AGENT_SEQUENCE.length === 8) {
            logTest('Agent Factory - Sequence', 'PASS', `All 8 agents defined in sequence`);
        }
        else {
            logTest('Agent Factory - Sequence', 'FAIL', `Expected 8 agents, got ${AGENT_SEQUENCE?.length || 0}`);
        }
        // Test invalid agent type handling
        try {
            AgentFactory.create('invalid_type');
            logTest('Agent Factory - Error Handling', 'FAIL', 'Should throw error for invalid agent type');
        }
        catch (expectedError) {
            logTest('Agent Factory - Error Handling', 'PASS', 'Properly handles invalid agent types');
        }
    }
    catch (error) {
        logTest('Agent Factory', 'FAIL', `Error: ${error.message}`);
    }
}
/**
 * Test 4: Base Agent Class Functionality
 */
async function testBaseAgentClass(logTest) {
    try {
        const { MarketResearchAgent } = await Promise.resolve().then(() => __importStar(require('./app/lib/agents/market-research')));
        const { AgentType } = await Promise.resolve().then(() => __importStar(require('./app/lib/api/types')));
        const agent = new MarketResearchAgent();
        // Test agent type assignment
        if (agent.type === AgentType.MARKET_RESEARCH) {
            logTest('Base Agent - Type Assignment', 'PASS', 'Agent type correctly assigned');
        }
        else {
            logTest('Base Agent - Type Assignment', 'FAIL', 'Agent type not properly assigned');
        }
        // Test required methods exist
        const requiredMethods = ['formatInput', 'parseOutput', 'validateOutput', 'execute'];
        const missingMethods = requiredMethods.filter(method => typeof agent[method] !== 'function');
        if (missingMethods.length === 0) {
            logTest('Base Agent - Required Methods', 'PASS', 'All required methods implemented');
        }
        else {
            logTest('Base Agent - Required Methods', 'FAIL', `Missing methods: ${missingMethods.join(', ')}`);
        }
        // Test formatInput method
        const mockContext = {
            workflowId: 'test-workflow',
            agentId: 'test-agent',
            input: { targetGenre: 'fitness', keywords: ['workout', 'health'] },
            previousOutputs: new Map()
        };
        const formattedInput = agent.formatInput(mockContext);
        if (typeof formattedInput === 'string' && formattedInput.includes('fitness') && formattedInput.includes('workout')) {
            logTest('Base Agent - Format Input', 'PASS', 'Input formatting works correctly');
        }
        else {
            logTest('Base Agent - Format Input', 'FAIL', 'Input formatting failed or incomplete');
        }
        // Test validateOutput method with valid data
        const validOutput = {
            recommended_genres: [{
                    genre: 'Test Genre',
                    trend_score: 85,
                    profitability_score: 90,
                    competition_level: 'medium',
                    market_size: '100M USD',
                    target_audience: '25-35 age group',
                    reason: 'Test reason',
                    keywords: ['test', 'keyword']
                }],
            analysis_summary: 'Test summary'
        };
        if (agent.validateOutput(validOutput)) {
            logTest('Base Agent - Validate Output (Valid)', 'PASS', 'Valid output correctly validated');
        }
        else {
            logTest('Base Agent - Validate Output (Valid)', 'FAIL', 'Valid output rejected');
        }
        // Test validateOutput method with invalid data
        const invalidOutput = { invalid: 'data' };
        if (!agent.validateOutput(invalidOutput)) {
            logTest('Base Agent - Validate Output (Invalid)', 'PASS', 'Invalid output correctly rejected');
        }
        else {
            logTest('Base Agent - Validate Output (Invalid)', 'FAIL', 'Invalid output incorrectly accepted');
        }
    }
    catch (error) {
        logTest('Base Agent Class', 'FAIL', `Error: ${error.message}`);
    }
}
/**
 * Test 5: Market Research Agent Specific Functionality
 */
async function testMarketResearchAgent(logTest) {
    try {
        const { MarketResearchAgent } = await Promise.resolve().then(() => __importStar(require('./app/lib/agents/market-research')));
        const agent = new MarketResearchAgent();
        // Test with different input scenarios
        const scenarios = [
            {
                name: 'With Genre and Keywords',
                input: { targetGenre: 'health & wellness', keywords: ['nutrition', 'fitness', 'wellness'] }
            },
            {
                name: 'With Genre Only',
                input: { targetGenre: 'technology' }
            },
            {
                name: 'With Keywords Only',
                input: { keywords: ['marketing', 'automation'] }
            },
            {
                name: 'Empty Input',
                input: {}
            }
        ];
        let successfulScenarios = 0;
        for (const scenario of scenarios) {
            try {
                const mockContext = {
                    workflowId: 'test-workflow',
                    agentId: 'test-agent',
                    input: scenario.input,
                    previousOutputs: new Map()
                };
                const formattedInput = agent.formatInput(mockContext);
                // Check that the formatted input contains expected elements
                const containsExpectedContent = formattedInput.includes('市場調査') &&
                    formattedInput.includes('JSON形式') &&
                    formattedInput.includes('recommended_genres');
                if (containsExpectedContent) {
                    successfulScenarios++;
                }
            }
            catch (scenarioError) {
                // Scenario failed
            }
        }
        if (successfulScenarios === scenarios.length) {
            logTest('Market Research Agent - Input Scenarios', 'PASS', `All ${scenarios.length} input scenarios handled`);
        }
        else {
            logTest('Market Research Agent - Input Scenarios', 'FAIL', `Only ${successfulScenarios}/${scenarios.length} scenarios succeeded`);
        }
        // Test JSON extraction functionality
        const mockJsonResponse = `
    Here is the analysis in JSON format:
    \`\`\`json
    {
      "recommended_genres": [{
        "genre": "Health Tech",
        "trend_score": 88,
        "profitability_score": 92,
        "competition_level": "medium",
        "market_size": "50B USD",
        "target_audience": "25-45 health-conscious adults",
        "reason": "Growing demand for digital health solutions",
        "keywords": ["healthtech", "wellness", "digital health"]
      }],
      "analysis_summary": "Health tech shows strong growth potential"
    }
    \`\`\`
    `;
        try {
            const parsedOutput = agent.parseOutput(mockJsonResponse);
            if (parsedOutput && parsedOutput.recommended_genres && parsedOutput.analysis_summary) {
                logTest('Market Research Agent - JSON Parsing', 'PASS', 'Successfully parsed JSON from response');
            }
            else {
                logTest('Market Research Agent - JSON Parsing', 'FAIL', 'Failed to parse JSON correctly');
            }
        }
        catch (parseError) {
            logTest('Market Research Agent - JSON Parsing', 'FAIL', `Parse error: ${parseError.message}`);
        }
    }
    catch (error) {
        logTest('Market Research Agent', 'FAIL', `Error: ${error.message}`);
    }
}
/**
 * Test 6: Database Integration
 */
async function testDatabaseIntegration(logTest) {
    try {
        // Test Prisma client initialization
        const prisma = new client_1.PrismaClient();
        try {
            // Test database connection
            await prisma.$connect();
            logTest('Database - Connection', 'PASS', 'Successfully connected to database');
            // Test basic database operations
            const testWorkflow = await prisma.workflow.create({
                data: {
                    name: 'Test Workflow - Agent Testing',
                    status: 'pending',
                    input: JSON.stringify({ test: true }),
                    agents: {
                        create: [
                            {
                                type: 'market_research',
                                status: 'pending',
                                input: JSON.stringify({ targetGenre: 'test' })
                            }
                        ]
                    }
                },
                include: {
                    agents: true
                }
            });
            if (testWorkflow && testWorkflow.agents.length > 0) {
                logTest('Database - Create Operations', 'PASS', `Created workflow with ID: ${testWorkflow.id}`);
                // Test update operations
                const updatedAgent = await prisma.agent.update({
                    where: { id: testWorkflow.agents[0].id },
                    data: {
                        status: 'running',
                        output: JSON.stringify({ test: 'output' })
                    }
                });
                if (updatedAgent.status === 'running') {
                    logTest('Database - Update Operations', 'PASS', 'Successfully updated agent status');
                }
                else {
                    logTest('Database - Update Operations', 'FAIL', 'Failed to update agent status');
                }
                // Cleanup test data
                await prisma.workflow.delete({
                    where: { id: testWorkflow.id }
                });
                logTest('Database - Cleanup', 'PASS', 'Successfully cleaned up test data');
            }
            else {
                logTest('Database - Create Operations', 'FAIL', 'Failed to create test workflow');
            }
        }
        catch (dbError) {
            logTest('Database - Operations', 'FAIL', `Database error: ${dbError.message}`);
        }
        finally {
            await prisma.$disconnect();
        }
    }
    catch (error) {
        logTest('Database Integration', 'FAIL', `Error: ${error.message}`);
    }
}
/**
 * Test 7: Integration Test - Simulate Agent Execution Flow
 */
async function testAgentExecutionFlow(logTest) {
    try {
        const { MarketResearchAgent } = await Promise.resolve().then(() => __importStar(require('./app/lib/agents/market-research')));
        const { AgentType, WorkflowStatus } = await Promise.resolve().then(() => __importStar(require('./app/lib/api/types')));
        const prisma = new client_1.PrismaClient();
        try {
            await prisma.$connect();
            // Create a test workflow for the integration test
            const testWorkflow = await prisma.workflow.create({
                data: {
                    name: 'Integration Test Workflow',
                    status: WorkflowStatus.RUNNING,
                    input: JSON.stringify({
                        targetGenre: 'digital marketing',
                        keywords: ['automation', 'AI', 'productivity']
                    }),
                    agents: {
                        create: [
                            {
                                type: AgentType.MARKET_RESEARCH,
                                status: WorkflowStatus.PENDING,
                                input: JSON.stringify({
                                    targetGenre: 'digital marketing',
                                    keywords: ['automation', 'AI', 'productivity']
                                })
                            }
                        ]
                    }
                },
                include: {
                    agents: true
                }
            });
            const agent = new MarketResearchAgent();
            const testAgent = testWorkflow.agents[0];
            // Test the input formatting step
            const context = {
                workflowId: testWorkflow.id,
                agentId: testAgent.id,
                input: JSON.parse(testAgent.input || '{}'),
                previousOutputs: new Map()
            };
            const formattedInput = agent.formatInput(context);
            if (formattedInput.includes('digital marketing') && formattedInput.includes('automation')) {
                logTest('Integration Test - Input Processing', 'PASS', 'Context properly processed by agent');
            }
            else {
                logTest('Integration Test - Input Processing', 'FAIL', 'Context not properly processed');
            }
            // Test workflow status tracking
            await prisma.workflow.update({
                where: { id: testWorkflow.id },
                data: { status: WorkflowStatus.COMPLETED }
            });
            const updatedWorkflow = await prisma.workflow.findUnique({
                where: { id: testWorkflow.id }
            });
            if (updatedWorkflow?.status === WorkflowStatus.COMPLETED) {
                logTest('Integration Test - Status Tracking', 'PASS', 'Workflow status properly tracked');
            }
            else {
                logTest('Integration Test - Status Tracking', 'FAIL', 'Workflow status not properly updated');
            }
            // Cleanup
            await prisma.workflow.delete({
                where: { id: testWorkflow.id }
            });
        }
        finally {
            await prisma.$disconnect();
        }
    }
    catch (error) {
        logTest('Integration Test', 'FAIL', `Error: ${error.message}`);
    }
}
/**
 * Test 8: Error Handling and Edge Cases
 */
async function testErrorHandling(logTest) {
    try {
        const { MarketResearchAgent } = await Promise.resolve().then(() => __importStar(require('./app/lib/agents/market-research')));
        const agent = new MarketResearchAgent();
        // Test malformed JSON parsing
        const malformedJsonResponse = `
    This is not valid JSON:
    {
      "recommended_genres": [
        {
          "genre": "Test"
          "missing_comma": true
        }
      ]
    }
    `;
        try {
            agent.parseOutput(malformedJsonResponse);
            logTest('Error Handling - Malformed JSON', 'FAIL', 'Should have thrown error for malformed JSON');
        }
        catch (expectedError) {
            logTest('Error Handling - Malformed JSON', 'PASS', 'Properly handles malformed JSON');
        }
        // Test empty/null input validation
        const emptyInputTests = [null, undefined, '', '{}', '[]'];
        let emptyInputHandled = 0;
        for (const testInput of emptyInputTests) {
            try {
                const isValid = agent.validateOutput(testInput);
                if (!isValid) {
                    emptyInputHandled++;
                }
            }
            catch {
                emptyInputHandled++;
            }
        }
        if (emptyInputHandled === emptyInputTests.length) {
            logTest('Error Handling - Empty Inputs', 'PASS', 'All empty inputs properly rejected');
        }
        else {
            logTest('Error Handling - Empty Inputs', 'FAIL', `Only ${emptyInputHandled}/${emptyInputTests.length} empty inputs handled`);
        }
        // Test partial/incomplete data validation
        const incompleteOutput = {
            recommended_genres: [{
                    genre: 'Test Genre',
                    // Missing required fields
                }],
            // Missing analysis_summary
        };
        if (!agent.validateOutput(incompleteOutput)) {
            logTest('Error Handling - Incomplete Data', 'PASS', 'Incomplete data properly rejected');
        }
        else {
            logTest('Error Handling - Incomplete Data', 'FAIL', 'Incomplete data incorrectly accepted');
        }
    }
    catch (error) {
        logTest('Error Handling', 'FAIL', `Error: ${error.message}`);
    }
}
/**
 * Main test runner
 */
async function runAllTests(logTest) {
    const tests = [
        { name: 'Environment Variables', fn: testEnvironmentVariables },
        { name: 'Gemini API Client', fn: testGeminiApiClient },
        { name: 'Agent Factory Pattern', fn: testAgentFactory },
        { name: 'Base Agent Class', fn: testBaseAgentClass },
        { name: 'Market Research Agent', fn: testMarketResearchAgent },
        { name: 'Database Integration', fn: testDatabaseIntegration },
        { name: 'Integration Test', fn: testAgentExecutionFlow },
        { name: 'Error Handling', fn: testErrorHandling }
    ];
    for (const test of tests) {
        try {
            await test.fn(logTest);
        }
        catch (error) {
            logTest(test.name, 'FAIL', `Unexpected error: ${error.message}`);
        }
    }
}
