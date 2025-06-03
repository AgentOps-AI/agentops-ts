
// Request schema for /v3/auth/token endpoint
export interface TokenSchema {
  api_key: string;
}

// Response schema for /v3/auth/token endpoint
export interface TokenResponse {
  token: string;
  project_id: string;
  project_prem_status: string;
}

// Verify token response schema
export interface VerifyTokenResponse {
  message: string;
  payload: Record<string, any>;
  expires_at: string;
}

export class BearerToken {
  constructor(private token: string) {}

  getToken(): string {
    return this.token;
  }

  getAuthHeader(): string {
    return `Bearer ${this.token}`;
  }
}

export class API {
  /**
   * Creates a new API client instance.
   *
   * @param apiKey - The API key for authentication
   * @param endpoint - The base endpoint URL for the API
   */
  constructor(private apiKey: string, private endpoint: string) {}

  /**
   * Get the user agent string for API requests
   */
  private get userAgent(): string {
    return `agentops-ts-sdk/${process.env.npm_package_version || 'unknown'}`;
  }

  /**
   * Fetch data from the API using the specified path and method.
   *
   * @param path - The API endpoint path
   * @param method - The HTTP method to use (GET or POST)
   * @param body - The request body for POST requests
   * @returns The parsed JSON response
   */
  private async fetch<T>(path: string, method: 'GET' | 'POST', body?: any): Promise<T> {
    const url = `${this.endpoint}${path}`;
    console.debug(`[agentops.api] ${method} ${url}`);

    const response = await fetch(url, {
      method: method,
      headers: {
        'User-Agent': this.userAgent,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    console.debug(`[agentops.api] ${response.status}`);
    return await response.json() as T;
  }

  /**
   * Authenticate with the AgentOps API using the provided API key.
   *
   * @returns A promise that resolves to a TokenResponse containing the authentication token
   */
  async authenticate(): Promise<TokenResponse> {
    return this.fetch<TokenResponse>('/v3/auth/token', 'POST', { api_key: this.apiKey });
  }
}