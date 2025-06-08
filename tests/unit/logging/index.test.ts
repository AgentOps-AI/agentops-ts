import * as logging from '../../../src/logging';
import { LogBuffer, globalLogBuffer } from '../../../src/logging/buffer';
import { LoggingInstrumentor, loggingInstrumentor } from '../../../src/logging/instrumentor';
import { LoggingService, loggingService } from '../../../src/logging/service';

describe('Logging module exports', () => {
  it('should export LogBuffer class', () => {
    expect(logging.LogBuffer).toBe(LogBuffer);
  });

  it('should export globalLogBuffer instance', () => {
    expect(logging.globalLogBuffer).toBe(globalLogBuffer);
    expect(logging.globalLogBuffer).toBeInstanceOf(LogBuffer);
  });

  it('should export LoggingInstrumentor class', () => {
    expect(logging.LoggingInstrumentor).toBe(LoggingInstrumentor);
  });

  it('should export loggingInstrumentor instance', () => {
    expect(logging.loggingInstrumentor).toBe(loggingInstrumentor);
    expect(logging.loggingInstrumentor).toBeInstanceOf(LoggingInstrumentor);
  });

  it('should export LoggingService class', () => {
    expect(logging.LoggingService).toBe(LoggingService);
  });

  it('should export loggingService instance', () => {
    expect(logging.loggingService).toBe(loggingService);
    expect(logging.loggingService).toBeInstanceOf(LoggingService);
  });
});