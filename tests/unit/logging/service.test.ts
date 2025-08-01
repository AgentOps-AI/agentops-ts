import { LoggingService } from '../../../src/instrumentation/console-logging/service';
import { API } from '../../../src/api';
import { globalLogBuffer } from '../../../src/instrumentation/console-logging/buffer';

// Mock the buffer module
jest.mock('../../../src/instrumentation/console-logging/buffer', () => ({
  globalLogBuffer: {
    getContent: jest.fn(),
    isEmpty: jest.fn(),
    clear: jest.fn(),
    append: jest.fn()
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

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize service', () => {
      service.initialize(mockApi);
      
      expect(service['enabled']).toBe(true);
      expect(service['api']).toBe(mockApi);
    });
  });

  describe('uploadLogs', () => {
    beforeEach(() => {
      service.initialize(mockApi);
    });

    it('should throw error when not initialized', async () => {
      const uninitializedService = new LoggingService();
      
      await expect(uninitializedService.uploadLogs('trace-123'))
        .rejects.toThrow('Logging service not initialized');
    });

    it('should return null when buffer is empty', async () => {
      (globalLogBuffer.getContent as jest.Mock).mockReturnValue('');
      (globalLogBuffer.isEmpty as jest.Mock).mockReturnValue(true);
      
      const result = await service.uploadLogs('trace-123');
      
      expect(result).toBeNull();
      expect(mockApi.uploadLogFile).not.toHaveBeenCalled();
    });

    it('should return null when buffer content is falsy', async () => {
      (globalLogBuffer.getContent as jest.Mock).mockReturnValue(null);
      (globalLogBuffer.isEmpty as jest.Mock).mockReturnValue(true);
      
      const result = await service.uploadLogs('trace-123');
      
      expect(result).toBeNull();
      expect(mockApi.uploadLogFile).not.toHaveBeenCalled();
    });

    it('should upload logs and return result', async () => {
      const logContent = 'LOG - test message\nINFO - info message';
      const uploadResult = { id: 'log-123' };
      
      (globalLogBuffer.getContent as jest.Mock).mockReturnValue(logContent);
      (globalLogBuffer.isEmpty as jest.Mock).mockReturnValue(false);
      mockApi.uploadLogFile.mockResolvedValue(uploadResult);
      
      const result = await service.uploadLogs('trace-123');
      
      expect(mockApi.uploadLogFile).toHaveBeenCalledWith(logContent, 'trace-123');
      expect(globalLogBuffer.clear).toHaveBeenCalled();
      expect(result).toBe(uploadResult);
    });

    it('should handle upload errors', async () => {
      const logContent = 'LOG - test message';
      const error = new Error('Upload failed');
      
      (globalLogBuffer.getContent as jest.Mock).mockReturnValue(logContent);
      (globalLogBuffer.isEmpty as jest.Mock).mockReturnValue(false);
      mockApi.uploadLogFile.mockRejectedValue(error);
      
      await expect(service.uploadLogs('trace-123')).rejects.toThrow('Upload failed');
      expect(globalLogBuffer.clear).not.toHaveBeenCalled();
    });
  });

  describe('getLogContent', () => {
    it('should return buffer content', () => {
      const content = 'LOG - test content';
      (globalLogBuffer.getContent as jest.Mock).mockReturnValue(content);
      
      const result = service.getLogContent();
      
      expect(result).toBe(content);
      expect(globalLogBuffer.getContent).toHaveBeenCalled();
    });
  });

  describe('clearLogs', () => {
    it('should clear the buffer', () => {
      service.clearLogs();
      
      expect(globalLogBuffer.clear).toHaveBeenCalled();
    });
  });

  describe('disable', () => {
    it('should disable service when enabled', () => {
      service.initialize(mockApi);
      expect(service['enabled']).toBe(true);
      
      service.disable();
      
      expect(service['enabled']).toBe(false);
    });

    it('should handle multiple disable calls', () => {
      service.initialize(mockApi);
      service.disable();
      service.disable(); // Second call should be no-op
      
      expect(service['enabled']).toBe(false);
    });
  });
});