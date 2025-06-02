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
   * Authenticate with API key and get bearer token
   */
  async authenticate(): Promise<TokenResponse> {
    const response = await fetch(`${this.endpoint}/v3/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ api_key: this.apiKey })
    });
    
    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json() as TokenResponse;
  }
}