/**
 * Secure API Client for Frontend
 * Handles all communication with the backend with proper error handling and security
 */

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
  isFormData?: boolean;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    // Use API_URL env var, fallback to same origin
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || "";
  }

  /**
   * Build full URL for API endpoint
   */
  private getFullUrl(endpoint: string): string {
    if (this.baseUrl) {
      return `${this.baseUrl}${endpoint}`;
    }
    // Same-origin request (monolithic Next.js setup)
    return endpoint;
  }

  /**
   * Get authorization headers with CSRF token if needed
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};

    // If using JWT tokens in localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Add CSRF token if available
      const csrfToken = document.querySelector(
        'meta[name="csrf-token"]'
      ) as HTMLMetaElement;
      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken.content;
      }
    }

    return headers;
  }

  /**
   * Make HTTP request with proper error handling
   */
  async request<T>(
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = "GET",
      body,
      headers: customHeaders = {},
      isFormData = false,
    } = options;

    try {
      const authHeaders = await this.getAuthHeaders();
      const url = this.getFullUrl(endpoint);

      let requestHeaders: Record<string, string> = {
        ...authHeaders,
        ...customHeaders,
      };

      let requestBody: BodyInit | undefined = undefined;

      if (body) {
        if (isFormData) {
          requestBody = body as BodyInit;
          // Don't set Content-Type for FormData, browser will set it with boundary
          delete requestHeaders["Content-Type"];
        } else {
          requestBody = JSON.stringify(body);
          requestHeaders["Content-Type"] = "application/json";
        }
      }

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        // Include credentials for same-origin and cross-origin requests with CORS
        credentials: "include",
      });

      // Handle authentication errors
      if (response.status === 401) {
        // Clear auth state and redirect to login
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          window.location.href = "/auth/login";
        }
        return {
          success: false,
          error: "Unauthorized. Please login again.",
        };
      }

      // Handle authorization errors
      if (response.status === 403) {
        return {
          success: false,
          error: "You don't have permission to access this resource.",
        };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error ||
            data.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: "GET", headers });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ) {
    return this.request<T>(endpoint, { method: "POST", body, headers });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ) {
    return this.request<T>(endpoint, { method: "PUT", body, headers });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ) {
    return this.request<T>(endpoint, { method: "PATCH", body, headers });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: "DELETE", headers });
  }

  /**
   * Upload file with FormData
   */
  async uploadFile<T>(
    endpoint: string,
    formData: FormData,
    headers?: Record<string, string>
  ) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
      headers,
      isFormData: true,
    });
  }
}

export const apiClient = new ApiClient();
