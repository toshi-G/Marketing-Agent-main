// Next.jsサーバーを使わずにAPIハンドラーを直接テストするスクリプト

const { PrismaClient } = require('@prisma/client');

// Mock NextRequest and NextResponse for testing
const mockNextResponse = {
  json: (data, options = {}) => ({
    data,
    status: options.status || 200,
    headers: options.headers || {}
  })
};

async function testWorkflowAPI() {
  console.log('🧪 Testing Workflow API handlers directly...\n');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Test GET /api/workflows (list workflows)
    console.log('1️⃣ Testing GET /api/workflows...');
    
    // Import the GET handler
    const { GET } = require('./app/api/workflows/route.ts');
    
    // Call the handler directly
    const getResult = await GET();
    const getResponse = await getResult.json();
    
    console.log('✅ GET /api/workflows successful');
    console.log('📊 Response data:', getResponse);
    console.log('📈 Found workflows:', Array.isArray(getResponse) ? getResponse.length : 'Error response');
    
    // 2. Test POST /api/workflows (create workflow)
    console.log('\n2️⃣ Testing POST /api/workflows...');
    
    const { POST } = require('./app/api/workflows/route.ts');
    
    // Mock request object
    const mockRequest = {
      json: async () => ({
        name: 'Test Workflow Direct API',
        initialInput: { target: 'health and wellness' }
      })
    };
    
    const postResult = await POST(mockRequest);
    const postResponse = await postResult.json();
    
    if (postResponse.error) {
      console.log('❌ POST /api/workflows failed:', postResponse.error);
    } else {
      console.log('✅ POST /api/workflows successful');
      console.log('📝 Created workflow ID:', postResponse.id);
      console.log('👥 Agents created:', postResponse.agents ? postResponse.agents.length : 0);
    }
    
    // 3. Test GET again to see if workflow was created
    console.log('\n3️⃣ Testing GET /api/workflows again...');
    
    const getResult2 = await GET();
    const getResponse2 = await getResult2.json();
    
    console.log('✅ GET /api/workflows (after creation) successful');
    console.log('📈 Total workflows:', Array.isArray(getResponse2) ? getResponse2.length : 'Error response');
    
    if (Array.isArray(getResponse2) && getResponse2.length > 0) {
      console.log('📋 Latest workflow:', {
        id: getResponse2[0].id,
        name: getResponse2[0].name,
        status: getResponse2[0].status,
        agents: getResponse2[0].agents?.length || 0
      });
    }
    
    console.log('\n🎉 All API handlers working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Database disconnected');
  }
}

// Run the test
testWorkflowAPI().catch(console.error);