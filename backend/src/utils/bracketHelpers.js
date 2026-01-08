/**
 * Calculate the next power of 2 greater than or equal to n
 */
function nextPowerOf2(n) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Calculate number of byes needed
 */
function calculateByes(participantCount) {
  const nextPower = nextPowerOf2(participantCount);
  return nextPower - participantCount;
}

/**
 * Determine which seeds should receive byes (top seeds get byes)
 */
function distributeByes(participantCount, byeCount) {
  const byeSeeds = [];
  for (let i = 1; i <= byeCount; i++) {
    byeSeeds.push(i); // Seeds 1, 2, 3, etc. get byes
  }
  return byeSeeds;
}

/**
 * Generate round names based on participant count
 */
function generateRoundNames(totalRounds) {
  const names = [];
  if (totalRounds >= 1) names.push('Final');
  if (totalRounds >= 2) names.unshift('Semi-Final');
  if (totalRounds >= 3) names.unshift('Quarter-Final');
  if (totalRounds >= 4) names.unshift('Round of 16');
  if (totalRounds >= 5) names.unshift('Round of 32');
  if (totalRounds >= 6) names.unshift('Round of 64');
  
  // For any additional rounds, just use "Round X"
  while (names.length < totalRounds) {
    names.unshift(`Round ${totalRounds - names.length}`);
  }
  
  return names;
}

export {
  nextPowerOf2,
  calculateByes,
  distributeByes,
  generateRoundNames
};
