/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

// Backend API configuration
export const API_CONFIG = {
  // API base URL - use environment variable or relative path for same-origin
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "",

  // API endpoints
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: "/api/v1/auth/login",
      SIGNUP: "/api/v1/auth/signup",
      LOGOUT: "/api/v1/auth/logout",
      REFRESH: "/api/v1/auth/refresh",
      VERIFY: "/api/v1/auth/verify",
    },

    // User endpoints
    USER: {
      PROFILE: "/api/v1/user/profile",
      UPDATE_PROFILE: "/api/v1/user/profile",
      CHANGE_PASSWORD: "/api/v1/user/change-password",
      DELETE_ACCOUNT: "/api/v1/user/account",
    },

    // Chat endpoints
    CHAT: {
      THREADS: "/api/v1/chat/threads",
      THREAD_DETAIL: "/api/v1/chat/threads/:id",
      MESSAGES: "/api/v1/chat/threads/:id/messages",
      CREATE_MESSAGE: "/api/v1/chat/threads/:id/messages",
      GENERATE_RESPONSE: "/api/v1/chat/threads/:id/generate",
    },

    // Other endpoints
    // Add more as needed
  },

  // CORS configuration
  CORS: {
    ALLOWED_ORIGINS: process.env.NEXT_PUBLIC_ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    ALLOWED_METHODS: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    ALLOWED_HEADERS: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "X-Requested-With",
    ],
  },

  // Request timeout (ms)
  REQUEST_TIMEOUT: 30000,

  // Rate limiting
  RATE_LIMIT: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60000, // 1 minute
  },

  // Token configuration
  TOKEN: {
    STORAGE_KEY: "auth_token",
    EXPIRY_BUFFER_MS: 5 * 60 * 1000, // 5 minutes before actual expiry
  },
};

/**
 * Format endpoint with parameters
 * Example: formatEndpoint("/api/v1/chat/threads/:id/messages", { id: "123" })
 */
export function formatEndpoint(
  endpoint: string,
  params?: Record<string, string>
): string {
  if (!params) return endpoint;

  let formatted = endpoint;
  for (const [key, value] of Object.entries(params)) {
    formatted = formatted.replace(`:${key}`, value);
  }
  return formatted;
}

/**
 * Build full URL for API endpoint
 */
export function buildApiUrl(endpoint: string, baseUrl?: string): string {
  const base = baseUrl || API_CONFIG.BASE_URL;
  if (base) {
    return `${base}${endpoint}`;
  }
  return endpoint;
}
