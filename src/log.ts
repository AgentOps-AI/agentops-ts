
let lastMessage: string = '';

// Patch console.log to track all console output
const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
  lastMessage = args.join(' ');
  originalConsoleLog(...args);
};

/**
 * Logs a message to console with AgentOps branding and duplicate prevention.
 *
 * @param message The message to log
 * @returns void
 */
export function logToConsole(message: string): void {
  const formattedMessage = `\x1b[34m🖇  AgentOps: ${message}\x1b[0m`;

  // Only prevent duplicates if the last console output was our exact same message
  if (lastMessage === formattedMessage) {
    return;
  }

  console.log(formattedMessage);
}