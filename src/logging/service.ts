import { API } from '../api';
import { globalLogBuffer } from './buffer';
import { loggingInstrumentor } from './instrumentor';

const debug = require('debug')('agentops:logging');

export interface LogUploadOptions {
  traceId?: string;
  clearAfterUpload?: boolean;
}

export class LoggingService {
  private api: API | null = null;
  private enabled: boolean = false;

  /**
   * Initialize the logging service
   */
  initialize(api: API): void {
    this.api = api;
    this.enabled = true;
    
    // Start capturing console output
    loggingInstrumentor.patch();
    loggingInstrumentor.setupCleanup();
    
    debug('Logging service initialized');
  }

  /**
   * Upload captured logs to the API
   */
  async uploadLogs(traceId: string): Promise<{ id: string } | null> {
    if (!this.enabled || !this.api) {
      throw new Error('Logging service not initialized');
    }

    const logContent = globalLogBuffer.getContent();
    
    if (!logContent || globalLogBuffer.isEmpty()) {
      debug('No logs to upload');
      return null;
    }

    try {
      debug(`Uploading ${logContent.length} characters of logs for trace ${traceId}`);
      
      const result = await this.api.uploadLogFile(logContent, traceId);
      
      debug(`Logs uploaded successfully: ${result.id}`);
      
      // Clear buffer after successful upload
      globalLogBuffer.clear();
      
      return result;
    } catch (error) {
      console.error('Failed to upload logs:', error);
      throw error;
    }
  }

  /**
   * Get the current log buffer content without uploading
   */
  getLogContent(): string {
    return globalLogBuffer.getContent();
  }

  /**
   * Clear the log buffer
   */
  clearLogs(): void {
    globalLogBuffer.clear();
  }

  /**
   * Disable logging and restore original console methods
   */
  disable(): void {
    if (this.enabled) {
      loggingInstrumentor.unpatch();
      this.enabled = false;
      debug('Logging service disabled');
    }
  }
}

// Global logging service instance
export const loggingService = new LoggingService();