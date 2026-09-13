/**
 * Secure API Route Handler Wrapper
 * Provides standardized response format, error handling, and security
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import {
  corsMiddleware,
  addCorsHeaders,
  securityHeadersMiddleware,
  rateLimitMiddleware,
  defaultSecurityConfig,
  type SecurityMiddlewareConfig,
} from "./middleware";
import logger from "logger";

export interface ApiHandlerOptions {
  requireAuth?: boolean;
  requireRole?: string | string[];
  corsConfig?: SecurityMiddlewareConfig;
  rateLimit?: boolean;
  methods?: string[];
  description?: string;
}

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Standard API response format
 */
export interface ApiResponsePayload<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

/**
 * Create a secure API route handler
 * Handles authentication, authorization, CORS, rate limiting, and error handling
 */
export function createApiHandler<T = unknown>(
  handler: (
    request: NextRequest,
    context: { params?: Record<string, string> }
  ) => Promise<T>,
  options: ApiHandlerOptions = {}
) {
  const {
    requireAuth = true,
    requireRole = undefined,
    corsConfig = defaultSecurityConfig,
    rateLimit = true,
    methods = ["GET", "POST", "PUT", "PATCH", "DELETE"],
    // `description` is accepted for documentation purposes but not used at runtime
  } = options;

  return async (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    try {
      // Handle CORS preflight
      const corsResponse = corsMiddleware(request, corsConfig);
      if (corsResponse) return corsResponse;

      // Check allowed methods
      if (!methods.includes(request.method)) {
        return createErrorResponse(
          `Method ${request.method} not allowed`,
          405
        );
      }

      // Rate limiting
      if (rateLimit) {
        const rateLimitResponse = rateLimitMiddleware(request);
        if (rateLimitResponse) return rateLimitResponse;
      }

      // Authentication check
      if (requireAuth) {
        const session = await getSession();
        if (!session?.user?.id) {
          return createErrorResponse("Unauthorized", 401);
        }

        // Authorization check
        if (requireRole) {
          const userRole = session.user.role;
          const allowedRoles = Array.isArray(requireRole)
            ? requireRole
            : [requireRole];

          if (!userRole || !allowedRoles.includes(userRole)) {
            return createErrorResponse(
              "Forbidden: Insufficient permissions",
              403
            );
          }
        }
      }

      // Call the handler (Next 16 passes `params` as a Promise)
      const params = context?.params ? await context.params : undefined;
      const data = await handler(request, { params });

      // Create response
      let response = createSuccessResponse(data);

      // Add security headers
      response = securityHeadersMiddleware(response);
      response = addCorsHeaders(response, request, corsConfig);

      return response;
    } catch (error) {
      logger.error("API handler error:", error);
      return handleApiError(error, request, corsConfig);
    }
  };
}

/**
 * Create successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse<ApiResponsePayload<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message: message || "Success",
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

/**
 * Create error API response
 */
export function createErrorResponse(
  error: string | ApiError,
  statusCode: number = 400
): NextResponse<ApiResponsePayload> {
  const errorMessage =
    typeof error === "string" ? error : error.message || "An error occurred";
  const code = typeof error === "object" ? error.code : undefined;

  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      code,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

/**
 * Handle API errors with proper status codes
 */
export function handleApiError(
  error: unknown,
  request: NextRequest,
  corsConfig: SecurityMiddlewareConfig = defaultSecurityConfig
): NextResponse<ApiResponsePayload> {
  let statusCode = 500;
  let errorMessage = "Internal server error";

  if (error instanceof Error) {
    errorMessage = error.message;

    // Check for specific error patterns
    if (
      error.message.includes("not found") ||
      error.message.toLowerCase().includes("not found")
    ) {
      statusCode = 404;
    } else if (
      error.message.includes("unauthorized") ||
      error.message.toLowerCase().includes("unauthorized")
    ) {
      statusCode = 401;
    } else if (
      error.message.includes("forbidden") ||
      error.message.toLowerCase().includes("forbidden")
    ) {
      statusCode = 403;
    } else if (
      error.message.includes("validation") ||
      error.message.toLowerCase().includes("validation")
    ) {
      statusCode = 400;
    }

    // Check for custom status code
    if ("statusCode" in error && typeof error.statusCode === "number") {
      statusCode = error.statusCode;
    }
  }

  let response = createErrorResponse(errorMessage, statusCode);

  // Add security headers
  response = securityHeadersMiddleware(response);
  response = addCorsHeaders(response, request, corsConfig);

  return response;
}

/**
 * Validate request body with Zod schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: unknown } }
): Promise<
  | { success: true; data: T; error?: undefined }
  | { success: false; data?: undefined; error: string }
> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false,
        error: "Invalid request body",
      };
    }

    return {
      success: true,
      data: result.data as T,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to parse request body",
    };
  }
}
