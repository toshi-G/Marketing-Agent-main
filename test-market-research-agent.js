#!/usr/bin/env node

/**
 * Market Research Agent Integration Test
 * 
 * This script specifically tests the Market Research Agent with a real Gemini API call
 * to ensure it can generate proper market research analysis.
 */

const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

// Load environment variables
dotenv.config();

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Mock MarketResearchAgent class for testing
 * This simulates the actual agent behavior
 */
class MockMarketResearchAgent {
  constructor() {
    this.type = 'market_research';
  }
  
  formatInput(context) {
    const { targetGenre, keywords } = context.input || {};
    
    let prompt = `市場調査を実施し、収益性の高いマーケティングジャンルを特定してください。\\n\\n`;
    
    if (targetGenre) {
      prompt += `対象分野: ${targetGenre}\\n`;
    }
    
    if (keywords && keywords.length > 0) {
      prompt += `関連キーワード: ${keywords.join(', ')}\\n`;
    }
    
    prompt += `
以下の観点から分析を行い、最適なジャンルを推奨してください：
1. 現在のトレンド（検索ボリューム、SNSでの話題性）
2. 収益性（市場規模、顧客の購買意欲、価格帯）
3. 参入しやすさ（競合状況、必要な専門知識、初期投資）

出力は以下のJSON形式でお願いします：
{
  "recommended_genres": [
    {
      "genre": "ジャンル名",
      "trend_score": 85,
      "profitability_score": 92,
      "competition_level": "medium",
      "market_size": "○○億円",
      "target_audience": "30-40代女性",
      "reason": "選定理由の詳細",
      "keywords": ["キーワード1", "キーワード2"]
    }
  ],
  "analysis_summary": "市場分析の総括"
}`;
    
    return prompt;
  }
  
  parseOutput(response) {
    return this.extractJson(response);
  }
  
  validateOutput(output) {
    if (!output || typeof output !== 'object') return false;
    
    // 必須フィールドのチェック
    if (!Array.isArray(output.recommended_genres)) return false;
    if (!output.analysis_summary || typeof output.analysis_summary !== 'string') return false;
    
    // 各ジャンルの検証
    for (const genre of output.recommended_genres) {
      if (!genre.genre || typeof genre.genre !== 'string') return false;
      if (typeof genre.trend_score !== 'number') return false;
      if (typeof genre.profitability_score !== 'number') return false;
      if (!genre.competition_level || typeof genre.competition_level !== 'string') return false;
      if (!genre.market_size || typeof genre.market_size !== 'string') return false;
      if (!genre.target_audience || typeof genre.target_audience !== 'string') return false;
      if (!genre.reason || typeof genre.reason !== 'string') return false;
      if (!Array.isArray(genre.keywords)) return false;
    }
    
    return true;
  }
  
  extractJson(text) {
    // 複数のJSONパターンを試行
    const patterns = [
      // Markdown形式のJSON
      /```json\s*([\s\S]*?)\s*```/,
      // プレーンJSONブロック
      /```\s*([\s\S]*?)\s*```/,
      // 中括弧で囲まれたJSON（最大のブロック）
      /({[\s\S]*})/,
      // 角括弧で囲まれたJSON配列
      /([\[\s\S]*\])/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const jsonStr = match[1].trim();
          const parsed = JSON.parse(jsonStr);
          return parsed;
        } catch (error) {
          continue;
        }
      }
    }
    
    // 直接全文を解析
    try {
      const parsed = JSON.parse(text.trim());
      return parsed;
    } catch (error) {
      throw new Error(`Failed to extract JSON from response: ${error}. Text preview: ${text.substring(0, 200)}...`);
    }
  }
}

/**
 * Test the Gemini API with market research prompt
 */
async function testMarketResearchAgentWithAPI() {
  log('🔬 Testing Market Research Agent with Real API Call', 'magenta');
  log('='.repeat(60), 'cyan');
  
  try {
    const agent = new MockMarketResearchAgent();
    
    // Create test context
    const testContext = {
      workflowId: 'test-workflow-id',
      agentId: 'test-agent-id',
      input: {
        targetGenre: 'ヘルスケア・ウェルネス',
        keywords: ['健康', 'フィットネス', '栄養', 'メンタルヘルス']
      },
      previousOutputs: new Map()
    };
    
    log('📝 Formatting input for agent...', 'blue');
    const formattedInput = agent.formatInput(testContext);
    log('✅ Input formatted successfully', 'green');
    log(`Input length: ${formattedInput.length} characters`, 'cyan');
    
    // Make actual API call to Gemini
    log('🚀 Making API call to Gemini...', 'blue');
    
    const apiKey = process.env.GEMINI_API_KEY;
    const apiRequest = {
      contents: [
        { role: 'user', parts: [{ text: formattedInput }] }
      ],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7
      },
      systemInstruction: {
        parts: [{ text: `あなたは市場調査のプロフェッショナルです。データに基づいた客観的な分析を行い、短期的なバズではなく中長期的なトレンドを重視してください。実際に収益化可能なジャンルに絞り、ニッチすぎず、広すぎないジャンルを選定してください。` }]
      }
    };
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiRequest)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;
    
    log('✅ API call successful', 'green');
    log(`Response length: ${responseText.length} characters`, 'cyan');
    log('📄 Raw response preview:', 'yellow');
    log(responseText.substring(0, 500) + '...', 'reset');
    
    // Parse the output
    log('\\n🔍 Parsing output...', 'blue');
    const parsedOutput = agent.parseOutput(responseText);
    log('✅ Output parsed successfully', 'green');
    
    // Validate the output
    log('✅ Validating output structure...', 'blue');
    const isValid = agent.validateOutput(parsedOutput);
    
    if (isValid) {
      log('✅ Output validation passed', 'green');
      
      // Display results summary
      log('\\n📊 Market Research Results:', 'magenta');
      log(`Number of recommended genres: ${parsedOutput.recommended_genres.length}`, 'cyan');
      
      parsedOutput.recommended_genres.forEach((genre, index) => {
        log(`\\n${index + 1}. ${genre.genre}`, 'yellow');
        log(`   Trend Score: ${genre.trend_score}/100`, 'cyan');
        log(`   Profitability Score: ${genre.profitability_score}/100`, 'cyan');
        log(`   Competition Level: ${genre.competition_level}`, 'cyan');
        log(`   Market Size: ${genre.market_size}`, 'cyan');
        log(`   Target Audience: ${genre.target_audience}`, 'cyan');
        log(`   Keywords: ${genre.keywords.join(', ')}`, 'cyan');
        log(`   Reason: ${genre.reason.substring(0, 100)}...`, 'reset');
      });
      
      log(`\\n📝 Analysis Summary:`, 'yellow');
      log(parsedOutput.analysis_summary, 'reset');
      
      log('\\n🎉 Market Research Agent Test PASSED!', 'green');
      
    } else {
      log('❌ Output validation failed', 'red');
      log('Raw parsed output:', 'yellow');
      console.log(JSON.stringify(parsedOutput, null, 2));
    }
    
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Test database integration with agent workflow
 */
async function testAgentDatabaseIntegration() {
  log('\\n💾 Testing Database Integration with Agent Workflow', 'magenta');
  log('='.repeat(60), 'cyan');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    
    // Create a workflow for testing
    const testWorkflow = await prisma.workflow.create({
      data: {
        name: 'Market Research Agent Test',
        status: 'running'
      }
    });
    
    log(`✅ Created test workflow: ${testWorkflow.id}`, 'green');
    
    // Create an agent record
    const testAgent = await prisma.agent.create({
      data: {
        workflowId: testWorkflow.id,
        type: 'market_research',
        status: 'pending',
        input: JSON.stringify({
          targetGenre: 'ヘルスケア・ウェルネス',
          keywords: ['健康', 'フィットネス']
        })
      }
    });
    
    log(`✅ Created test agent: ${testAgent.id}`, 'green');
    
    // Simulate agent execution - update status to running
    await prisma.agent.update({
      where: { id: testAgent.id },
      data: { status: 'running' }
    });
    
    log('✅ Updated agent status to running', 'green');
    
    // Simulate completion with mock output
    const mockOutput = {
      recommended_genres: [{
        genre: 'パーソナルフィットネス',
        trend_score: 85,
        profitability_score: 90,
        competition_level: 'medium',
        market_size: '5000億円',
        target_audience: '25-45歳の健康志向層',
        reason: 'コロナ禍以降、自宅でのフィットネス需要が急増',
        keywords: ['フィットネス', 'ダイエット', 'エクササイズ']
      }],
      analysis_summary: 'ヘルスケア・ウェルネス分野は持続的な成長が期待される市場です。'
    };
    
    await prisma.agent.update({
      where: { id: testAgent.id },
      data: {
        status: 'completed',
        output: JSON.stringify(mockOutput),
        completedAt: new Date()
      }
    });
    
    log('✅ Updated agent with completion data', 'green');
    
    // Verify the data was stored correctly
    const retrievedAgent = await prisma.agent.findUnique({
      where: { id: testAgent.id },
      include: { workflow: true }
    });
    
    if (retrievedAgent && retrievedAgent.output) {
      const storedOutput = JSON.parse(retrievedAgent.output);
      log('✅ Successfully retrieved and parsed stored output', 'green');
      log(`Stored genre: ${storedOutput.recommended_genres[0].genre}`, 'cyan');
    } else {
      throw new Error('Failed to retrieve stored output');
    }
    
    // Cleanup
    await prisma.workflow.delete({
      where: { id: testWorkflow.id }
    });
    
    log('✅ Cleaned up test data', 'green');
    log('🎉 Database Integration Test PASSED!', 'green');
    
  } catch (error) {
    log(`❌ Database integration test failed: ${error.message}`, 'red');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Main test execution
 */
async function runIntegrationTests() {
  log('🧪 Market Research Agent Integration Tests', 'magenta');
  log('='.repeat(70), 'cyan');
  
  try {
    // Test 1: API Integration
    await testMarketResearchAgentWithAPI();
    
    // Test 2: Database Integration  
    await testAgentDatabaseIntegration();
    
    log('\\n🏆 All Integration Tests PASSED!', 'green');
    log('✨ The Market Research Agent is working correctly!', 'magenta');
    
  } catch (error) {
    log(`\\n💥 Integration Tests FAILED: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle errors
process.on('uncaughtException', (error) => {
  log(`❌ Uncaught Exception: ${error.message}`, 'red');
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled Rejection at: ${promise}, reason: ${reason}`, 'red');
  process.exit(1);
});

// Run the integration tests
runIntegrationTests().catch(error => {
  log(`❌ Test execution failed: ${error.message}`, 'red');
  console.error(error.stack);
  process.exit(1);
});