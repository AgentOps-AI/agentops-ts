/**
 * Simple memory buffer for capturing console logs
 */
export class LogBuffer {
  private buffer: string[] = [];

  /**
   * Append a log entry to the buffer
   */
  append(entry: string): void {
    const timestamp = new Date().toISOString();
    const formattedEntry = `${timestamp} - ${entry}`;
    this.buffer.push(formattedEntry);
  }

  /**
   * Get all buffer content as a single string
   */
  getContent(): string {
    return this.buffer.join('\n');
  }

  /**
   * Clear the buffer
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Check if buffer is empty
   */
  isEmpty(): boolean {
    return this.buffer.length === 0;
  }
}

// Global log buffer instance
export const globalLogBuffer = new LogBuffer();