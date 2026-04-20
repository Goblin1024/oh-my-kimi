/**
 * HUD Renderer
 *
 * Provides simple ANSI-based terminal rendering for the Heads-Up Display.
 */

export const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

export function clearScreen(): void {
  if (!process.stdout.isTTY) return;
  // \x1b[3J clears scrollback buffer, \x1b[2J clears visible screen, \x1b[H moves cursor home
  process.stdout.write('\x1b[3J\x1b[2J\x1b[H');
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(' ');
}

export function drawHeader(title: string): void {
  const width = process.stdout.columns || 80;
  const padding = Math.max(0, width - title.length - 4);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;

  console.log(
    `${colors.bgBlue}${colors.white}${colors.bold}  ${' '.repeat(leftPad)}${title}${' '.repeat(rightPad)}  ${colors.reset}`
  );
  console.log('');
}

export function drawSection(title: string): void {
  console.log(`${colors.bold}${colors.cyan}▶ ${title}${colors.reset}`);
}

export function drawKeyValue(key: string, value: string, valueColor = colors.white): void {
  console.log(
    `  ${colors.dim}${key.padEnd(15)}:${colors.reset} ${valueColor}${value}${colors.reset}`
  );
}
