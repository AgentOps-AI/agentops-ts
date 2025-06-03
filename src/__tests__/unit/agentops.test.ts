import '../mocks/opentelemetry';
import { AgentOps } from '../../agentops';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AgentOps', () => {
  let agentops: AgentOps;

  beforeEach(() => {
    // Clear environment variables
    delete process.env.AGENTOPS_API_KEY;
    agentops = new AgentOps();
    mockFetch.mockClear();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (agentops.initialized) {
      await agentops.shutdown();
    }
  });

  describe('initialization', () => {
    it('should not be initialized on construction', () => {
      expect(agentops.initialized).toBe(false);
    });

    it('should throw error when no API key provided', async () => {
      await expect(agentops.init()).rejects.toThrow(
        'API key is required. Set AGENTOPS_API_KEY environment variable or pass it in config.'
      );
    });

    it('should initialize successfully with API key in config', async () => {
      // Mock successful auth response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'test-jwt-token' }),
      });

      await agentops.init({ apiKey: 'test-api-key' });

      expect(agentops.initialized).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.agentops.ai/v3/auth/token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ api_key: 'test-api-key' }),
        })
      );
    });

    it('should initialize successfully with API key from environment', async () => {
      process.env.AGENTOPS_API_KEY = 'env-api-key';
      // Create new instance after setting env var
      const envAgentOps = new AgentOps();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'test-jwt-token' }),
      });

      await envAgentOps.init();

      expect(envAgentOps.initialized).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.agentops.ai/v3/auth/token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ api_key: 'env-api-key' }),
        })
      );
      
      // Cleanup
      await envAgentOps.shutdown();
    });

    it('should warn when already initialized', async () => {
      process.env.AGENTOPS_API_KEY = 'test-key';
      const warnAgentOps = new AgentOps();
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: 'test-jwt-token' }),
      });

      await warnAgentOps.init();
      await warnAgentOps.init(); // Second call

      expect(console.warn).toHaveBeenCalledWith('AgentOps already initialized');
      
      // Cleanup
      await warnAgentOps.shutdown();
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully when initialized', async () => {
      process.env.AGENTOPS_API_KEY = 'test-key';
      const shutdownAgentOps = new AgentOps();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'test-jwt-token' }),
      });

      await shutdownAgentOps.init();
      await shutdownAgentOps.shutdown();

      expect(shutdownAgentOps.initialized).toBe(false);
    });

    it('should handle shutdown when not initialized', async () => {
      await expect(agentops.shutdown()).resolves.not.toThrow();
      expect(agentops.initialized).toBe(false);
    });
  });
});