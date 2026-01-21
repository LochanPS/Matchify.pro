// Test script to check user ledger system
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUserLedger() {
  try {
    console.log('🔍 Testing user ledger system...');
    
    // 1. Check recent registrations
    const recentRegistrations = await prisma.registration.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        tournament: {
          select: { name: true }
        },
        category: {
          select: { name: true }
        }
      }
    });
    
    console.log('\n📋 Recent registrations:');
    recentRegistrations.forEach((reg, index) => {
      console.log(`${index + 1}. ${reg.user.name} - ${reg.tournament.name}`);
      console.log(`   Amount: ₹${reg.amountTotal}`);
      console.log(`   Status: ${reg.status}`);
      console.log(`   Date: ${reg.createdAt}`);
      console.log('');
    });
    
    // 2. Check user ledger entries
    const ledgerEntries = await prisma.userPaymentLedger.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });
    
    console.log('\n💰 User ledger entries:');
    if (ledgerEntries.length === 0) {
      console.log('❌ No ledger entries found - this indicates the ledger system is not working');
    } else {
      ledgerEntries.forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.user.name} - ${entry.type}`);
        console.log(`   Amount: ₹${entry.amount}`);
        console.log(`   Description: ${entry.description}`);
        console.log(`   Date: ${entry.createdAt}`);
        console.log('');
      });
    }
    
    // 3. Check user payment summaries
    const summaries = await prisma.userPaymentSummary.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });
    
    console.log('\n📊 User payment summaries:');
    if (summaries.length === 0) {
      console.log('❌ No payment summaries found');
    } else {
      summaries.forEach((summary, index) => {
        console.log(`${index + 1}. ${summary.user.name}`);
        console.log(`   Total Paid: ₹${summary.totalPaid}`);
        console.log(`   Total Received: ₹${summary.totalReceived}`);
        console.log(`   Balance: ₹${summary.currentBalance}`);
        console.log(`   Transactions: ${summary.transactionCount}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing user ledger:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserLedger();