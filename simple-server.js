// 簡易HTTPサーバーでワークフローAPIをテスト

const http = require('http');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Parse URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  try {
    if (url.pathname === '/api/workflows' && req.method === 'GET') {
      // GET /api/workflows - ワークフロー一覧取得
      console.log('📋 GET /api/workflows requested');
      
      const workflows = await prisma.workflow.findMany({
        include: {
          agents: {
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(workflows));
      
      console.log('✅ Returned', workflows.length, 'workflows');
      
    } else if (url.pathname === '/api/workflows' && req.method === 'POST') {
      // POST /api/workflows - 新規ワークフロー作成
      console.log('✨ POST /api/workflows requested');
      
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const { name } = data;
          
          // 簡易的なワークフロー作成（エージェントは作らない）
          const workflow = await prisma.workflow.create({
            data: {
              name: name || `Test Workflow ${new Date().toLocaleString('ja-JP')}`,
              status: 'pending'
            }
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(workflow));
          
          console.log('✅ Created workflow:', workflow.id);
          
        } catch (error) {
          console.error('❌ POST error:', error.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      
    } else if (url.pathname === '/api/health') {
      // Health check
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected'
      }));
      
    } else {
      // 404 - Not found
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
    
  } catch (error) {
    console.error('❌ Server error:', error.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error: ' + error.message }));
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Simple API server running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('  - GET  /api/workflows');
  console.log('  - POST /api/workflows');
  console.log('  - GET  /api/health');
  console.log('\n🧪 Test with:');
  console.log(`  curl http://localhost:${PORT}/api/health`);
  console.log(`  curl http://localhost:${PORT}/api/workflows`);
});

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});