// Test script to verify the banner status fix
// Helper function to normalize is_active values from backend
const normalizeIsActive = (isActive) => {
  return Boolean(isActive && isActive !== '0' && isActive !== 0);
};

// Test cases
const testCases = [
  { input: true, expected: true, description: 'Boolean true' },
  { input: false, expected: false, description: 'Boolean false' },
  { input: 1, expected: true, description: 'Number 1' },
  { input: 0, expected: false, description: 'Number 0' },
  { input: '1', expected: true, description: 'String "1"' },
  { input: '0', expected: false, description: 'String "0"' },
  { input: 'true', expected: true, description: 'String "true"' },
  { input: 'false', expected: true, description: 'String "false" (truthy)' },
  { input: '', expected: false, description: 'Empty string' },
  { input: null, expected: false, description: 'null' },
  { input: undefined, expected: false, description: 'undefined' },
];

console.log('Testing normalizeIsActive function:');
console.log('=====================================');

testCases.forEach((testCase, index) => {
  const result = normalizeIsActive(testCase.input);
  const passed = result === testCase.expected;
  const status = passed ? '✅ PASS' : '❌ FAIL';
  
  console.log(`${status} Test ${index + 1}: ${testCase.description}`);
  console.log(`   Input: ${JSON.stringify(testCase.input)} (${typeof testCase.input})`);
  console.log(`   Expected: ${testCase.expected}`);
  console.log(`   Got: ${result}`);
  console.log(`   Display: ${result ? 'Active' : 'Inactive'}`);
  console.log('');
});

// Test the old behavior vs new behavior
console.log('Comparison with old behavior:');
console.log('==============================');

const oldBehaviorTestCases = ['0', '1', 0, 1, true, false];

oldBehaviorTestCases.forEach(input => {
  const oldResult = Boolean(input);
  const newResult = normalizeIsActive(input);
  const changed = oldResult !== newResult;
  const changeIndicator = changed ? '🔄 CHANGED' : '✅ SAME';
  
  console.log(`${changeIndicator} Input: ${JSON.stringify(input)} (${typeof input})`);
  console.log(`   Old Boolean(): ${oldResult} -> ${oldResult ? 'Active' : 'Inactive'}`);
  console.log(`   New normalizeIsActive(): ${newResult} -> ${newResult ? 'Active' : 'Inactive'}`);
  console.log('');
});

console.log('Test completed!');
