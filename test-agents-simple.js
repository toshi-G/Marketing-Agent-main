#!/usr/bin/env node

/**
 * Simplified AI Agent Test Script
 * 
 * This script tests the core AI agent functionality using compiled JavaScript.
 * Since the project uses TypeScript, we'll compile individual modules as needed.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

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

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  testResults.total++;
  const statusColor = status === 'PASS' ? 'green' : 'red';
  const prefix = status === 'PASS' ? '✅' : '❌';
  
  if (status === 'PASS') {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
  
  testResults.details.push({ name: testName, status, details });
  log(`${prefix} ${testName}`, statusColor);
  
  if (details) {
    log(`   ${details}`, 'cyan');
  }
}

/**
 * Test 1: Environment Variable Validation
 */
async function testEnvironmentVariables() {
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
    
    logTest('Environment Variables - GEMINI_API_KEY', 'PASS', `API key present and valid format (${apiKey.length} chars)`);
    
    // Test other environment variables
    const nodeEnv = process.env.NODE_ENV || 'development';
    const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
    
    logTest('Environment Variables - Configuration', 'PASS', `NODE_ENV: ${nodeEnv}, DB: ${dbUrl.substring(0, 20)}...`);
    
  } catch (error) {
    logTest('Environment Variables', 'FAIL', `Error: ${error.message}`);
  }
}

/**
 * Test 2: Database Connection
 */
async function testDatabaseConnection() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test database connection
    await prisma.$connect();
    logTest('Database - Connection', 'PASS', 'Successfully connected to database');
    
    // Test basic query
    const workflowCount = await prisma.workflow.count();
    logTest('Database - Query Test', 'PASS', `Found ${workflowCount} workflows in database`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    logTest('Database Connection', 'FAIL', `Error: ${error.message}`);
  }
}

/**
 * Test 3: Gemini API Basic Test
 */
async function testGeminiApiBasic() {
  try {
    // Simple fetch-based test to Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    
    const testRequest = {
      contents: [
        { role: 'user', parts: [{ text: 'Respond with exactly "TEST_OK"' }] }
      ],
      generationConfig: {
        maxOutputTokens: 50,
        temperature: 0.1
      }
    };
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testRequest)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logTest('Gemini API - Basic Test', 'FAIL', `API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      return;
    }
    
    const data = await response.json();
    
    if (data && data.candidates && data.candidates.length > 0) {
      const responseText = data.candidates[0].content.parts[0].text;
      logTest('Gemini API - Basic Test', 'PASS', `Response: "${responseText.trim()}"`);
    } else {
      logTest('Gemini API - Basic Test', 'FAIL', 'Invalid response structure');
    }
    
  } catch (error) {
    logTest('Gemini API - Basic Test', 'FAIL', `Error: ${error.message}`);
  }
}

/**
 * Test 4: TypeScript Compilation Test
 */
async function testTypeScriptCompilation() {
  try {
    // Test if TypeScript can compile individual agent files
    const agentFiles = [
      'app/lib/api/types.ts',
      'app/lib/api/config.ts',
      'app/lib/utils/env.ts',
      'app/lib/agents/base.ts',
      'app/lib/agents/market-research.ts'
    ];
    
    let compiledFiles = 0;
    
    for (const file of agentFiles) {
      try {
        if (fs.existsSync(file)) {
          // Try to compile just this file to check syntax
          execSync(`npx tsc --noEmit --skipLibCheck ${file}`, { stdio: 'pipe' });
          compiledFiles++;
        }
      } catch (compileError) {
        // Individual file compilation failed
      }
    }
    
    if (compiledFiles === agentFiles.length) {
      logTest('TypeScript Compilation', 'PASS', `All ${agentFiles.length} core files compile successfully`);
    } else {
      logTest('TypeScript Compilation', 'FAIL', `Only ${compiledFiles}/${agentFiles.length} files compiled successfully`);
    }
    
  } catch (error) {
    logTest('TypeScript Compilation', 'FAIL', `Error: ${error.message}`);
  }
}

/**
 * Test 5: Project Structure Validation
 */
async function testProjectStructure() {
  try {
    const requiredFiles = [
      'app/lib/agents/base.ts',
      'app/lib/agents/market-research.ts',
      'app/lib/agents/index.ts',
      'app/lib/api/client.ts',
      'app/lib/api/types.ts',
      'app/lib/api/config.ts',
      'app/lib/utils/env.ts',
      'app/lib/utils/db.ts',
      'prisma/schema.prisma',
      'package.json'
    ];
    
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length === 0) {
      logTest('Project Structure', 'PASS', `All ${requiredFiles.length} required files present`);
    } else {
      logTest('Project Structure', 'FAIL', `Missing files: ${missingFiles.join(', ')}`);
    }
    
    // Check for agent files
    const agentDir = 'app/lib/agents';
    if (fs.existsSync(agentDir)) {
      const agentFiles = fs.readdirSync(agentDir).filter(f => f.endsWith('.ts') && f !== 'index.ts');
      logTest('Project Structure - Agents', 'PASS', `Found ${agentFiles.length} agent files: ${agentFiles.join(', ')}`);
    } else {
      logTest('Project Structure - Agents', 'FAIL', 'Agents directory not found');
    }
    
  } catch (error) {
    logTest('Project Structure', 'FAIL', `Error: ${error.message}`);
  }
}

/**
 * Test 6: Config File Validation
 */
async function testConfigValidation() {
  try {
    // Test package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const requiredDependencies = ['@prisma/client', 'next', 'react', 'zod'];
    const missingDeps = requiredDependencies.filter(dep => 
      !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
    );
    
    if (missingDeps.length === 0) {
      logTest('Config - Dependencies', 'PASS', `All required dependencies present`);
    } else {
      logTest('Config - Dependencies', 'FAIL', `Missing dependencies: ${missingDeps.join(', ')}`);
    }
    
    // Test Prisma schema
    const schemaContent = fs.readFileSync('prisma/schema.prisma', 'utf8');
    const requiredModels = ['Workflow', 'Agent', 'WorkflowResult'];
    const foundModels = requiredModels.filter(model => schemaContent.includes(`model ${model}`));
    
    if (foundModels.length === requiredModels.length) {
      logTest('Config - Prisma Schema', 'PASS', `All required models defined: ${foundModels.join(', ')}`);
    } else {
      logTest('Config - Prisma Schema', 'FAIL', `Missing models: ${requiredModels.filter(m => !foundModels.includes(m)).join(', ')}`);
    }
    
  } catch (error) {
    logTest('Config Validation', 'FAIL', `Error: ${error.message}`);
  }
}

/**
 * Test 7: Agent Type Definitions Test
 */
async function testAgentTypeDefinitions() {
  try {
    // Since we can't easily import TypeScript files, we'll check the source
    const typesFile = fs.readFileSync('app/lib/api/types.ts', 'utf8');
    
    const expectedAgentTypes = [
      'MARKET_RESEARCH',
      'CONTENT_SCRAPING', 
      'NLP_CLASSIFICATION',
      'TEMPLATE_OPTIMIZATION',
      'BUSINESS_STRATEGY',
      'CONTENT_CREATION',
      'COPY_GENERATION',
      'OPTIMIZATION_ARCHIVE'
    ];
    
    const foundTypes = expectedAgentTypes.filter(type => typesFile.includes(type));
    
    if (foundTypes.length === expectedAgentTypes.length) {
      logTest('Agent Types - Definitions', 'PASS', `All ${expectedAgentTypes.length} agent types defined`);
    } else {
      logTest('Agent Types - Definitions', 'FAIL', `Missing types: ${expectedAgentTypes.filter(t => !foundTypes.includes(t)).join(', ')}`);
    }
    
    // Check for output interfaces
    const outputInterfaces = [
      'MarketResearchOutput',
      'ContentScrapingOutput',
      'NLPClassificationOutput',
      'TemplateOptimizationOutput',
      'BusinessStrategyOutput',
      'ContentCreationOutput',
      'CopyGenerationOutput',
      'OptimizationArchiveOutput'
    ];
    
    const foundInterfaces = outputInterfaces.filter(iface => typesFile.includes(`interface ${iface}`));
    
    if (foundInterfaces.length === outputInterfaces.length) {
      logTest('Agent Types - Output Interfaces', 'PASS', `All ${outputInterfaces.length} output interfaces defined`);
    } else {
      logTest('Agent Types - Output Interfaces', 'FAIL', `Missing interfaces: ${outputInterfaces.filter(i => !foundInterfaces.includes(i)).join(', ')}`);
    }
    
  } catch (error) {
    logTest('Agent Type Definitions', 'FAIL', `Error: ${error.message}`);
  }
}

/**
 * Test 8: Database Schema Validation
 */
async function testDatabaseSchema() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    
    // Test if we can perform basic CRUD operations
    const testWorkflow = await prisma.workflow.create({
      data: {
        name: 'Test Workflow - Schema Validation',
        status: 'pending'
      }
    });
    
    if (testWorkflow.id) {
      logTest('Database Schema - Create', 'PASS', `Created workflow with ID: ${testWorkflow.id}`);
      
      // Test update
      const updatedWorkflow = await prisma.workflow.update({
        where: { id: testWorkflow.id },
        data: { status: 'running' }
      });
      
      if (updatedWorkflow.status === 'running') {
        logTest('Database Schema - Update', 'PASS', 'Successfully updated workflow status');
      } else {
        logTest('Database Schema - Update', 'FAIL', 'Failed to update workflow status');
      }
      
      // Test relations by creating an agent
      const testAgent = await prisma.agent.create({
        data: {
          workflowId: testWorkflow.id,
          type: 'market_research',
          status: 'pending',
          input: JSON.stringify({ targetGenre: 'test' })
        }
      });
      
      if (testAgent.id) {
        logTest('Database Schema - Relations', 'PASS', 'Successfully created related agent record');
      } else {
        logTest('Database Schema - Relations', 'FAIL', 'Failed to create related agent record');
      }
      
      // Cleanup
      await prisma.workflow.delete({
        where: { id: testWorkflow.id }
      });
      
      logTest('Database Schema - Cleanup', 'PASS', 'Successfully cleaned up test data');
      
    } else {
      logTest('Database Schema - Create', 'FAIL', 'Failed to create test workflow');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    logTest('Database Schema', 'FAIL', `Error: ${error.message}`);
  }
}

/**
 * Main test execution
 */
async function runAllTests() {
  log('🚀 Starting AI Agent Functionality Tests', 'magenta');
  log('='.repeat(50), 'cyan');
  
  const tests = [
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Gemini API Basic', fn: testGeminiApiBasic },
    { name: 'TypeScript Compilation', fn: testTypeScriptCompilation },
    { name: 'Project Structure', fn: testProjectStructure },
    { name: 'Config Validation', fn: testConfigValidation },
    { name: 'Agent Type Definitions', fn: testAgentTypeDefinitions },
    { name: 'Database Schema', fn: testDatabaseSchema }
  ];
  
  for (const test of tests) {
    try {
      log(`\n🔍 Running: ${test.name}`, 'blue');
      await test.fn();
    } catch (error) {
      logTest(test.name, 'FAIL', `Unexpected error: ${error.message}`);
    }
  }
  
  // Display final results
  log('\n' + '='.repeat(50), 'cyan');
  log('📊 Test Results Summary:', 'blue');
  log(`Total Tests: ${testResults.total}`, 'cyan');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'cyan');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 
      testResults.failed > 0 ? 'yellow' : 'green');
  
  // Show failed tests details
  if (testResults.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    testResults.details
      .filter(test => test.status === 'FAIL')
      .forEach(test => {
        log(`  • ${test.name}: ${test.details}`, 'red');
      });
  } else {
    log('\n🎉 All tests passed!', 'green');
  }
  
  log('\n✨ Test execution completed!', 'magenta');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
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

// Run the tests
runAllTests().catch(error => {
  log(`❌ Test execution failed: ${error.message}`, 'red');
  console.error(error.stack);
  process.exit(1);
});