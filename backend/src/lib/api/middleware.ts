/**
 * API Security Middleware
 * Provides CORS, rate limiting, validation, and security headers
 */

import { NextRequest, NextResponse } from "next/server";
import logger from "logger";

export interface SecurityMiddlewareConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposeHeaders: string[];
  maxAge: number;
  credentialsAllowed: boolean;
}

/**
 * Default security middleware configuration
 */
export const defaultSecurityConfig: SecurityMiddlewareConfig = {
  allowedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
  ],
  allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-CSRF-Token",
    "X-Requested-With",
  ],
  exposeHeaders: ["X-Total-Count", "X-Page-Number", "X-Rate-Limit-Remaining"],
  maxAge: 86400, // 24 hours
  credentialsAllowed: true,
};

/**
 * CORS middleware - handles cross-origin requests
 */
export function corsMiddleware(
  request: NextRequest,
  config: SecurityMiddlewareConfig = defaultSecurityConfig
): NextResponse | null {
  const origin = request.headers.get("origin");

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    const isOriginAllowed =
      !origin ||
      config.allowedOrigins.includes(origin) ||
      isOriginPatternAllowed(origin, config.allowedOrigins);

    if (!isOriginAllowed) {
      return new NextResponse(null, { status: 403 });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": config.allowedMethods.join(", "),
        "Access-Control-Allow-Headers": config.allowedHeaders.join(", "),
        "Access-Control-Max-Age": config.maxAge.toString(),
        "Access-Control-Allow-Credentials": config.credentialsAllowed
          ? "true"
          : "false",
      },
    });
  }

  return null;
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders<T>(
  response: NextResponse<T>,
  request: NextRequest,
  config: SecurityMiddlewareConfig = defaultSecurityConfig
): NextResponse<T> {
  const origin = request.headers.get("origin");
  const isOriginAllowed =
    !origin ||
    config.allowedOrigins.includes(origin) ||
    isOriginPatternAllowed(origin, config.allowedOrigins);

  if (isOriginAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin || "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      config.allowedMethods.join(", ")
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      config.allowedHeaders.join(", ")
    );
    response.headers.set(
      "Access-Control-Expose-Headers",
      config.exposeHeaders.join(", ")
    );
    response.headers.set(
      "Access-Control-Allow-Credentials",
      config.credentialsAllowed ? "true" : "false"
    );
  }

  return response;
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware<T>(
  response: NextResponse<T>
): NextResponse<T> {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  );

  // Remove server identification
  response.headers.delete("Server");
  response.headers.delete("X-Powered-By");

  return response;
}

/**
 * Rate limiting middleware (simple in-memory implementation)
 * For production, use Redis
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Clean up old requests periodically
    setInterval(() => this.cleanup(), this.windowMs);
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove requests outside the window
    const recentRequests = requests.filter((time) => now - time < this.windowMs);

    if (recentRequests.length < this.maxRequests) {
      recentRequests.push(now);
      this.requests.set(key, recentRequests);
      return true;
    }

    return false;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const recentRequests = requests.filter((time) => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, requests] of this.requests.entries()) {
      const recentRequests = requests.filter((time) => now - time < this.windowMs);
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}

export const rateLimiter = new RateLimiter(100, 60000); // 100 requests per minute

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(
  request: NextRequest,
  limiter: RateLimiter = rateLimiter
): NextResponse | null {
  const identifier =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!limiter.isAllowed(identifier)) {
    logger.warn(`Rate limit exceeded for ${identifier}`);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: "Too many requests. Please try again later.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      }
    );
  }

  return null;
}

/**
 * Check if origin matches allowed pattern
 * Supports wildcards like https://*.example.com
 */
function isOriginPatternAllowed(
  origin: string,
  allowedOrigins: string[]
): boolean {
  return allowedOrigins.some((pattern) => {
    const regexPattern = pattern
      .replace(/\./g, "\\.")
      .replace(/\*/g, "[^/]+");
    return new RegExp(`^${regexPattern}$`).test(origin);
  });
}
