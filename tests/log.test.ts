import { logToConsole } from '../src/log';

describe('logToConsole', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log');
    (console.log as jest.Mock).mockClear();
  });

  it('formats message and avoids duplicates', () => {
    logToConsole('hello');
    expect((console.log as jest.Mock).mock.calls[0][0]).toContain('AgentOps: hello');
    (console.log as jest.Mock).mockClear();
    logToConsole('hello');
    expect((console.log as jest.Mock)).not.toHaveBeenCalled();
    logToConsole('world');
    expect((console.log as jest.Mock).mock.calls[0][0]).toContain('AgentOps: world');
  });
});
