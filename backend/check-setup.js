import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 MATCHIFY SETUP STATUS CHECK\n');

// Check files
const files = [
  'package.json',
  '.env',
  'prisma/schema.prisma',
  'prisma/seed.js',
  'src/server.js'
];

console.log('📁 File Check:');
files.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Check node_modules
const nodeModulesExists = fs.existsSync(path.join(__dirname, 'node_modules'));
console.log(`   ${nodeModulesExists ? '✅' : '❌'} node_modules/`);

// Check environment variables
console.log('\n🔧 Environment Variables:');
dotenv.config();
const envVars = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
envVars.forEach(envVar => {
  const exists = process.env[envVar] !== undefined;
  console.log(`   ${exists ? '✅' : '❌'} ${envVar}`);
});

// Check Prisma client
console.log('\n📦 Prisma Client:');
try {
  const { PrismaClient } = await import('@prisma/client');
  console.log('   ✅ Prisma Client imported successfully');
} catch (error) {
  console.log('   ❌ Prisma Client not found - run: npx prisma generate');
}

console.log('\n🎯 Next Steps:');
console.log('   1. Set up PostgreSQL database (Railway or local)');
console.log('   2. Update DATABASE_URL in .env');
console.log('   3. Run: npx prisma migrate dev --name init');
console.log('   4. Run: npx prisma db seed');
console.log('   5. Test: node test-db.js');
console.log('\n📚 See DATABASE_SETUP.md for detailed instructions');