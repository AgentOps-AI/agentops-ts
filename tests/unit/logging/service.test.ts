import { LoggingService } from '../../../src/logging/service';
import { API } from '../../../src/api';
import { globalLogBuffer } from '../../../src/logging/buffer';
import { loggingInstrumentor } from '../../../src/logging/instrumentor';

// Mock the instrumentor and buffer modules
jest.mock('../../../src/logging/instrumentor', () => ({
  loggingInstrumentor: {
    patch: jest.fn(),
    unpatch: jest.fn(),
    setupCleanup: jest.fn()
  }
}));

jest.mock('../../../src/logging/buffer', () => ({
  globalLogBuffer: {
    getContent: jest.fn(),
    isEmpty: jest.fn(),
    clear: jest.fn()
  }
}));

describe('LoggingService', () => {
  let service: LoggingService;
  let mockApi: jest.Mocked<API>;

  beforeEach(() => {
    service = new LoggingService();
    mockApi = {
      uploadLogFile: jest.fn()
    } as any;
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize service and start instrumentor', () => {
      service.initialize(mockApi);
      
      expect(loggingInstrumentor.patch).toHaveBeenCalled();
      expect(loggingInstrumentor.setupCleanup).toHaveBeenCalled();
    });
  });

  describe('uploadLogs', () => {
    beforeEach(() => {
      service.initialize(mockApi);
    });

    it('should throw error if not initialized', async () => {
      const uninitializedService = new LoggingService();
      
      await expect(uninitializedService.uploadLogs('trace-123'))
        .rejects.toThrow('Logging service not initialized');
    });

    it('should return null if buffer is empty', async () => {
      (globalLogBuffer.getContent as jest.Mock).mockReturnValue('');
      (globalLogBuffer.isEmpty as jest.Mock).mockReturnValue(true);
      
      const result = await service.uploadLogs('trace-123');
      
      expect(result).toBeNull();
      expect(mockApi.uploadLogFile).not.toHaveBeenCalled();
    });

    it('should upload logs successfully', async () => {
      const logContent = '2024-01-01T00:00:00.000Z - LOG - Test message';
      (globalLogBuffer.getContent as jest.Mock).mockReturnValue(logContent);
      (globalLogBuffer.isEmpty as jest.Mock).mockReturnValue(false);
      mockApi.uploadLogFile.mockResolvedValue({ id: 'upload-123' });
      
      const result = await service.uploadLogs('trace-123');
      
      expect(mockApi.uploadLogFile).toHaveBeenCalledWith(logContent, 'trace-123');
      expect(result).toEqual({ id: 'upload-123' });
      expect(globalLogBuffer.clear).toHaveBeenCalled();
    });

    it('should handle upload errors', async () => {
      const logContent = 'Test log';
      (globalLogBuffer.getContent as jest.Mock).mockReturnValue(logContent);
      (globalLogBuffer.isEmpty as jest.Mock).mockReturnValue(false);
      mockApi.uploadLogFile.mockRejectedValue(new Error('Upload failed'));
      
      // Mock console.error to prevent test output noise
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      await expect(service.uploadLogs('trace-123'))
        .rejects.toThrow('Upload failed');
      
      expect(globalLogBuffer.clear).not.toHaveBeenCalled();
      
      // Restore console.error
      console.error = originalConsoleError;
    });
  });

  describe('getLogContent', () => {
    it('should return log content from buffer', () => {
      const logContent = 'Test log content';
      (globalLogBuffer.getContent as jest.Mock).mockReturnValue(logContent);
      
      const result = service.getLogContent();
      
      expect(result).toBe(logContent);
      expect(globalLogBuffer.getContent).toHaveBeenCalled();
    });
  });

  describe('clearLogs', () => {
    it('should clear the log buffer', () => {
      service.clearLogs();
      
      expect(globalLogBuffer.clear).toHaveBeenCalled();
    });
  });

  describe('disable', () => {
    it('should unpatch instrumentor when enabled', () => {
      service.initialize(mockApi);
      
      service.disable();
      
      expect(loggingInstrumentor.unpatch).toHaveBeenCalled();
    });

    it('should not unpatch if not enabled', () => {
      service.disable();
      
      expect(loggingInstrumentor.unpatch).not.toHaveBeenCalled();
    });

    it('should handle multiple disable calls', () => {
      service.initialize(mockApi);
      
      service.disable();
      service.disable(); // Second call should be no-op
      
      expect(loggingInstrumentor.unpatch).toHaveBeenCalledTimes(1);
    });
  });
});