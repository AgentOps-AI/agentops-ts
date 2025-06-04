import '@jest/globals';
import { API, TokenResponse } from '../src/api';

describe('API', () => {
  const mockApiKey = 'test-api-key';
  const mockEndpoint = 'https://api.agentops.ai';
  let api: API;

  beforeEach(() => {
    api = new API(mockApiKey, mockEndpoint);
    // Mock fetch globally
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should successfully authenticate with valid API key', async () => {
      const mockResponse: TokenResponse = {
        token: 'test-token',
        project_id: 'test-project',
        project_prem_status: 'active'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await api.authenticate();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockEndpoint}/v3/auth/token`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ api_key: mockApiKey })
        })
      );
    });

    it('should throw error when authentication fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      await expect(api.authenticate()).rejects.toThrow('Request failed: 401 Unauthorized');
    });
  });
}); 