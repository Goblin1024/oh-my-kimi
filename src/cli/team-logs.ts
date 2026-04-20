/**
 * omk team logs - View worker logs
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

export async function teamLogs(workerId?: string): Promise<void> {
  const logDir = join(process.cwd(), '.omk', 'logs', 'team', 'latest');

  if (!existsSync(logDir)) {
    console.log('No team logs found for the current project.');
    return;
  }

  const logFiles = readdirSync(logDir).filter((f) => f.endsWith('.log'));

  if (logFiles.length === 0) {
    console.log('No worker logs found.');
    return;
  }

  if (!workerId) {
    console.log('Available worker logs:');
    for (const file of logFiles) {
      console.log(`  - ${file.replace('.log', '')}`);
    }
    console.log('\nRun "omk team logs <workerId>" to view a specific log.');
    return;
  }

  const logFile = join(logDir, `${workerId}.log`);
  if (!existsSync(logFile)) {
    console.error(`Log for worker "${workerId}" not found.`);
    return;
  }

  try {
    const content = readFileSync(logFile, 'utf-8');
    if (!content.trim()) {
      console.log(`[Log for ${workerId} is empty]`);
    } else {
      console.log(`--- Log for ${workerId} ---`);
      console.log(content);
      console.log(`--- End of Log ---`);
    }
  } catch (err) {
    console.error(`Error reading log file: ${err instanceof Error ? err.message : String(err)}`);
  }
}
