// Test Cloudinary Connection
import { config } from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

// Load environment variables
config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('\n🔍 Testing Cloudinary Connection...\n');
console.log('Configuration:');
console.log('  Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('  API Key:', process.env.CLOUDINARY_API_KEY);
console.log('  API Secret:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing');
console.log('');

// Test connection by fetching account details
cloudinary.api.ping()
  .then(result => {
    console.log('✅ SUCCESS! Cloudinary is connected!\n');
    console.log('Response:', result);
    console.log('\n📁 Your Cloudinary folders:');
    console.log('  - matchify/profiles (Profile photos)');
    console.log('  - matchify/academy-payments (Payment screenshots)');
    console.log('  - matchify/academy-photos (Academy photos)');
    console.log('  - matchify/academy-qrcodes (Academy QR codes)');
    console.log('  - matchify/tournament-qrcodes (Tournament QR codes)');
    console.log('\n🌐 Dashboard: https://cloudinary.com/console');
    console.log('');
  })
  .catch(error => {
    console.error('❌ ERROR! Cloudinary connection failed!\n');
    console.error('Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('  1. Check your .env file exists in matchify/backend/');
    console.log('  2. Verify credentials are correct');
    console.log('  3. Make sure no extra spaces in .env values');
    console.log('  4. Restart your terminal/server');
    console.log('');
  });
