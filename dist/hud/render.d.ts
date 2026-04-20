/**
 * HUD Renderer
 *
 * Provides simple ANSI-based terminal rendering for the Heads-Up Display.
 */
export declare const colors: {
    reset: string;
    bold: string;
    dim: string;
    italic: string;
    underline: string;
    black: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    magenta: string;
    cyan: string;
    white: string;
    bgBlack: string;
    bgRed: string;
    bgGreen: string;
    bgYellow: string;
    bgBlue: string;
    bgMagenta: string;
    bgCyan: string;
    bgWhite: string;
};
export declare function clearScreen(): void;
export declare function formatDuration(ms: number): string;
export declare function drawHeader(title: string): void;
export declare function drawSection(title: string): void;
export declare function drawKeyValue(key: string, value: string, valueColor?: string): void;
//# sourceMappingURL=render.d.ts.map