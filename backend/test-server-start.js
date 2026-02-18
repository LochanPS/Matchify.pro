import http from 'http';

console.log('🧪 Testing Backend Server Startup...\n');

// Test if port 5000 is available
const testPort = 5000;
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Test server');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️  Port ${testPort} is already in use`);
    console.log('   This means the backend server might already be running!');
    console.log('   Check: http://localhost:5000/health\n');
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});

server.listen(testPort, () => {
  console.log(`✅ Port ${testPort} is available`);
  console.log('✅ Backend can start on this port\n');
  server.close();
  
  // Now test if we can make a request to the health endpoint
  console.log('🔍 Checking if backend is already running...');
  
  http.get(`http://localhost:${testPort}/health`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('✅ Backend is running!');
      console.log('   Response:', data);
      process.exit(0);
    });
  }).on('error', () => {
    console.log('ℹ️  Backend is not currently running');
    console.log('   You can start it with: npm run dev\n');
    process.exit(0);
  });
});
