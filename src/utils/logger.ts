class Logger {
  private static instance: Logger;

  private constructor() { }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public debug(...messages: any[]) {
    if (import.meta.env.DEV) {
      console.log(...messages);
    }
  }

  public error(...messages: any[]) {
    console.error(...messages);
  }
}

export default Logger;

export function logCaller(message = '') {
  const stack = new Error().stack;
  if (stack) {
    const relevantLines = stack.split('\n').slice(2, 5).join('\n');
    console.log(`[${new Date().toISOString()}] ${message}\nCaller trace:\n${relevantLines}`);
  }
}

