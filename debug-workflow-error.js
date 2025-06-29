// ワークフローエラーの詳細デバッグスクリプト

const { PrismaClient } = require('@prisma/client');

async function debugWorkflowError() {
  console.log('🔍 Debugging workflow list error...\n');
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    // 1. 基本的なデータベース接続テスト
    console.log('1️⃣ Testing basic database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful:', result);
    
    // 2. Workflowテーブルの存在確認
    console.log('\n2️⃣ Checking Workflow table...');
    const workflowCount = await prisma.workflow.count();
    console.log('✅ Workflow table accessible, count:', workflowCount);
    
    // 3. Agentテーブルの存在確認
    console.log('\n3️⃣ Checking Agent table...');
    const agentCount = await prisma.agent.count();
    console.log('✅ Agent table accessible, count:', agentCount);
    
    // 4. シンプルなクエリテスト
    console.log('\n4️⃣ Testing simple workflow query...');
    const workflows = await prisma.workflow.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log('✅ Simple workflow query successful, found:', workflows.length);
    
    // 5. Includeクエリテスト (エラーの原因かもしれません)
    console.log('\n5️⃣ Testing workflow query with agents include...');
    try {
      const workflowsWithAgents = await prisma.workflow.findMany({
        include: {
          agents: {
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      console.log('✅ Include query successful, found:', workflowsWithAgents.length);
      
      if (workflowsWithAgents.length > 0) {
        console.log('📋 Sample workflow:');
        const sample = workflowsWithAgents[0];
        console.log('  - ID:', sample.id);
        console.log('  - Name:', sample.name);
        console.log('  - Status:', sample.status);
        console.log('  - Agents count:', sample.agents.length);
      }
    } catch (includeError) {
      console.error('❌ Include query failed:', includeError.message);
      console.error('This might be the source of the Internal Server Error');
    }
    
    // 6. スキーマ整合性の確認
    console.log('\n6️⃣ Checking schema integrity...');
    const tableInfo = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
    `;
    console.log('✅ Available tables:', tableInfo.map(t => t.name));
    
    // 7. 外部キー制約の確認
    console.log('\n7️⃣ Checking foreign key constraints...');
    const fkInfo = await prisma.$queryRaw`
      PRAGMA foreign_key_list(Agent);
    `;
    console.log('✅ Agent foreign keys:', fkInfo);
    
    console.log('\n🎉 All database operations successful!');
    console.log('💡 If the web interface shows "Internal Server Error", the issue is likely in:');
    console.log('   - Next.js server startup process');
    console.log('   - Environment variable loading in the web context');
    console.log('   - TypeScript compilation in the web environment');
    
  } catch (error) {
    console.error('❌ Database debug failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Database disconnected');
  }
}

// Run the debug
debugWorkflowError().catch(console.error);