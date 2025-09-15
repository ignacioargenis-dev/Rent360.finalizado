// Edge Runtime compatible logger
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, any>;
  context?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
  tags?: string[];
}

class EdgeLogger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    return levels[level] <= levels[this.logLevel];
  }

  private formatLogEntry(level: LogLevel, message: string, data?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context: data?.context || 'application'
    };
  }

  private outputToConsole(entry: LogEntry): void {
    const logMessage = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
    const logData = entry.data ? ` ${JSON.stringify(entry.data)}` : '';

    switch (entry.level) {
      case 'error':
        console.error(logMessage + logData);
        break;
      case 'warn':
        console.warn(logMessage + logData);
        break;
      case 'info':
        console.log(logMessage + logData);
        break;
      case 'debug':
        console.log(logMessage + logData);
        break;
    }
  }

  async error(message: string, data?: Record<string, any>): Promise<void> {
    if (!this.shouldLog('error')) return;
    const entry = this.formatLogEntry('error', message, data);
    this.outputToConsole(entry);
  }

  async warn(message: string, data?: Record<string, any>): Promise<void> {
    if (!this.shouldLog('warn')) return;
    const entry = this.formatLogEntry('warn', message, data);
    this.outputToConsole(entry);
  }

  async info(message: string, data?: Record<string, any>): Promise<void> {
    if (!this.shouldLog('info')) return;
    const entry = this.formatLogEntry('info', message, data);
    this.outputToConsole(entry);
  }

  async debug(message: string, data?: Record<string, any>): Promise<void> {
    if (!this.shouldLog('debug')) return;
    const entry = this.formatLogEntry('debug', message, data);
    this.outputToConsole(entry);
  }
}

// Export singleton instance
export const logger = new EdgeLogger();
