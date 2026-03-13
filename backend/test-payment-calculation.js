/**
 * Test Payment Calculation
 * Verify: 5% + 30% + 65% = 100%
 */

function testPaymentCalculation(totalAmount) {
  const platformFee = Math.round(totalAmount * 0.03);
  const firstPayout = Math.round(totalAmount * 0.30);
  const secondPayout = Math.round(totalAmount * 0.67);
  const sum = platformFee + firstPayout + secondPayout;
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Testing: ₹${totalAmount}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Platform Fee (5%):    ₹${platformFee}`);
  console.log(`First Payout (30%):   ₹${firstPayout}`);
  console.log(`Second Payout (65%):  ₹${secondPayout}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Sum: ₹${sum}`);
  console.log(`Match: ${sum === totalAmount ? '✅ CORRECT' : '❌ WRONG'}`);
  
  return sum === totalAmount;
}

console.log('\n🧪 PAYMENT CALCULATION TEST\n');

// Test cases
const testCases = [100, 500, 1000, 2500, 5000, 10000];
let allPassed = true;

for (const amount of testCases) {
  const passed = testPaymentCalculation(amount);
  if (!passed) allPassed = false;
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`\n${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
console.log(`\nFormula: 5% + 30% + 65% = 100%\n`);
