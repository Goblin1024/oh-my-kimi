/**
 * Mock Kimi Agent
 *
 * Used for testing Team Mode without actually launching real Kimi CLI instances.
 * Reads stdin, waits a bit, and outputs a mock response.
 */

const workerId = process.env.WORKER_ID || 'unknown';
const delay = parseInt(process.env.MOCK_DELAY || '1000', 10);

console.log(`[Mock Kimi ${workerId}] Started.`);

let input = '';
process.stdin.on('data', (chunk) => {
  input += chunk.toString();
});

process.stdin.on('end', () => {
  console.log(`[Mock Kimi ${workerId}] Received task input (${input.length} bytes). Processing...`);

  // eslint-disable-next-line no-undef
  setTimeout(() => {
    console.log(`[Mock Kimi ${workerId}] Task completed successfully.`);
    if (input.includes('fail')) {
      console.error(`[Mock Kimi ${workerId}] Simulated failure!`);
      process.exit(1);
    } else {
      process.exit(0);
    }
  }, delay);
});
