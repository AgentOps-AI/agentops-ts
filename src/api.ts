const debug = require('debug')('agentops:api');

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
  private bearerToken: BearerToken | null = null;

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
   * Set the bearer token for authenticated requests
   */
  setBearerToken(token: BearerToken): void {
    this.bearerToken = token;
  }

  /**
   * Fetch data from the API using the specified path and method.
   *
   * @param path - The API endpoint path
   * @param method - The HTTP method to use (GET or POST)
   * @param body - The request body for POST requests
   * @param headers - Additional headers to include in the request
   * @returns The parsed JSON response
   */
  private async fetch<T>(
    path: string, 
    method: 'GET' | 'POST', 
    body?: any, 
    headers?: Record<string, string>
  ): Promise<T> {
    const url = `${this.endpoint}${path}`;

    const defaultHeaders: Record<string, string> = {
      'User-Agent': this.userAgent,
      'Content-Type': 'application/json',
    };

    // Add authorization header if bearer token is available
    if (this.bearerToken) {
      defaultHeaders['Authorization'] = this.bearerToken.getAuthHeader();
    }

    // Merge with additional headers
    const finalHeaders = { ...defaultHeaders, ...headers };

    const response = await fetch(url, {
      method: method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Ignore JSON parsing errors
      }
      throw new Error(errorMessage);
    }

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

  /**
   * Upload log content to the API.
   *
   * @param logContent - The log content to upload
   * @param traceId - The trace ID to associate with the logs
   * @returns A promise that resolves when the upload is complete
   */
  async uploadLogFile(logContent: string, traceId: string): Promise<{ id: string }> {
    if (!this.bearerToken) {
      throw new Error('Authentication required. Bearer token not set.');
    }

    return this.fetch<{ id: string }>(
      '/v4/logs/upload/',
      'POST',
      logContent,
      { 'Trace-Id': traceId }
    );
  }
}