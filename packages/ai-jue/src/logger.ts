import pc from 'picocolors';

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    SILENT = 4
}

export class Logger {
    private static instance: Logger;
    private level: LogLevel = LogLevel.INFO;

    private constructor() {}

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public setLevel(level: LogLevel) {
        this.level = level;
    }

    public debug(message: string, ...args: any[]) {
        if (this.level <= LogLevel.DEBUG) {
            console.log(pc.dim(`[DEBUG] ${message}`), ...args);
        }
    }

    public info(message: string, ...args: any[]) {
        if (this.level <= LogLevel.INFO) {
            console.log(pc.blue(`[INFO]`), message, ...args);
        }
    }

    // For standard user output without prefix, or use info? 
    // The requirement asks for structured logs. Let's stick to prefixes for "log" methods.
    // But for CLI interaction, we might want raw output.
    public log(message: string, ...args: any[]) {
        if (this.level <= LogLevel.INFO) {
            console.log(message, ...args);
        }
    }

    public success(message: string, ...args: any[]) {
        if (this.level <= LogLevel.INFO) {
            console.log(pc.green(`[SUCCESS]`), message, ...args);
        }
    }

    public warn(message: string, ...args: any[]) {
        if (this.level <= LogLevel.WARN) {
            console.warn(pc.yellow(`[WARN]`), message, ...args);
        }
    }

    public error(message: string, ...args: any[]) {
        if (this.level <= LogLevel.ERROR) {
            console.error(pc.red(`[ERROR]`), message, ...args);
        }
    }
}

export const logger = Logger.getInstance();
