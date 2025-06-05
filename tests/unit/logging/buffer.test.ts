import { LogBuffer } from '../../../src/logging/buffer';

describe('LogBuffer', () => {
  let buffer: LogBuffer;

  beforeEach(() => {
    buffer = new LogBuffer();
  });

  describe('append', () => {
    it('should add entries with timestamps', () => {
      buffer.append('Test message');
      
      const content = buffer.getContent();
      expect(content).toContain('Test message');
      // Check for ISO timestamp format
      expect(content).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z - Test message/);
    });

    it('should handle multiple entries', () => {
      buffer.append('Message 1');
      buffer.append('Message 2');
      buffer.append('Message 3');
      
      const content = buffer.getContent();
      const lines = content.split('\n');
      
      expect(lines).toHaveLength(3);
      expect(lines[0]).toContain('Message 1');
      expect(lines[1]).toContain('Message 2');
      expect(lines[2]).toContain('Message 3');
    });
  });

  describe('getContent', () => {
    it('should return empty string when buffer is empty', () => {
      expect(buffer.getContent()).toBe('');
    });

    it('should join entries with newlines', () => {
      buffer.append('Line 1');
      buffer.append('Line 2');
      
      const content = buffer.getContent();
      expect(content).toContain('Line 1');
      expect(content).toContain('Line 2');
      expect(content.split('\n')).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('should remove all entries from buffer', () => {
      buffer.append('Message 1');
      buffer.append('Message 2');
      
      buffer.clear();
      
      expect(buffer.isEmpty()).toBe(true);
      expect(buffer.getContent()).toBe('');
    });
  });

  describe('isEmpty', () => {
    it('should return true for new buffer', () => {
      expect(buffer.isEmpty()).toBe(true);
    });

    it('should return false when buffer has entries', () => {
      buffer.append('Message');
      expect(buffer.isEmpty()).toBe(false);
    });

    it('should return true after clearing', () => {
      buffer.append('Message');
      buffer.clear();
      expect(buffer.isEmpty()).toBe(true);
    });
  });
});