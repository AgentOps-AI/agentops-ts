/**
 * API client for AgentOps authentication and communication
 * Based on AgentOps v3/auth/token OpenAPI specification
 */

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

/**
 * Bearer token class for API authentication.
 */
export class BearerToken {
  constructor(private token: string) {}

  /**
   * Get the token value for authorization headers
   */
  getToken(): string {
    return this.token;
  }

  /**
   * Get the authorization header value
   */
  getAuthHeader(): string {
    return `Bearer ${this.token}`;
  }
}

export class API {
  constructor(private apiKey: string, private endpoint: string) {}

  /**
   * Private method to make JSON API requests
   */
  private async fetch<T>(path: string, method: 'GET' | 'POST', body?: any): Promise<T> {
    const url = `${this.endpoint}${path}`;
    console.debug(`[agentops.api] ${method} ${url}`);

    const response = await fetch(url, {
      method: method,
      headers: {
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
   * Authenticate with API key and get bearer token
   */
  async authenticate(): Promise<TokenResponse> {
    return this.fetch<TokenResponse>('/v3/auth/token', 'POST', { api_key: this.apiKey });
  }
}