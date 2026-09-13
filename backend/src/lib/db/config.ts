import "load-env";

// ============================================================================
// Database Provider Types
// ============================================================================

export type DbProvider =
  | "supabase"
  | "neon"
  | "loca"
  | "railway"
  | "render"
  | "heroku"
  | "aws-rds"
  | "google-cloud-sql"
  | "azure-flexible-server"
  | "generic";

// Provider-specific connection info
export interface ProviderConfig {
  provider: DbProvider;
  // Core connection
  url: string;
  // SSL configuration
  ssl?: {
    rejectUnauthorized: boolean;
    ca?: string;
    key?: string;
    cert?: string;
  };
  // Provider-specific options
  options?: {
    // For Supabase
    useConnectionPooler?: boolean;
    // For Neon
    connectionLimit?: number;
    // For pooled connections (Supabase, Neon, etc.)
    poolMode?: "transaction" | "session";
    // Connection timeout
    connectionTimeout?: number;
    // Keepalive
    keepAlive?: boolean;
    // Additional libpq compatibility (for newer pg versions)
    useLibpqCompat?: boolean;
  };
}

// ============================================================================
// Validation Schemas
// ============================================================================

// NOTE: zod schemas were removed — validation happens inline in
// getDbConfig()/validateDbConfig().

// ============================================================================
// Environment Variable Extraction
// ============================================================================

/**
 * Extract database configuration from environment variables.
 * Supports multiple provider formats and auto-detects the provider.
 */
export function getDbConfig(): ProviderConfig {
  // load-env is imported as a side-effect at the top of the file
  // It automatically loads .env files into process.env

  const databaseUrl = process.env.POSTGRES_URL;

  if (!databaseUrl) {
    throw new Error(
      "POSTGRES_URL environment variable is required. " +
        "See .env.example for configuration examples."
    );
  }

  // Detect provider from URL hostname
  const provider = detectProvider(databaseUrl);

  // URL parsing is handled by detectProvider/buildProviderOptions below

  // Build SSL config
  const sslConfig = buildSslConfig(databaseUrl, provider);

  // Build provider-specific options
  const options = buildProviderOptions(provider, databaseUrl);

  return {
    provider,
    url: normalizeUrl(databaseUrl),
    ssl: sslConfig,
    options,
  };
}

/**
 * Detect the database provider from the connection URL.
 */
function detectProvider(url: string): DbProvider {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Supabase: db.<project-ref>.supabase.co
    if (hostname.includes(".supabase.co")) {
      return "supabase";
    }

    // Neon: <project-id>.neon.tech or *.neon.tech
    if (hostname.includes(".neon.tech")) {
      return "neon";
    }

    // Railway: <subdomain>.railway.app
    if (hostname.includes(".railway.app")) {
      return "railway";
    }

    // Render: <subdomain>.onrender.com
    if (hostname.includes(".onrender.com")) {
      return "render";
    }

    // Heroku: <subdomain>.herokuapp.com or *.heroku.com
    if (
      hostname.includes(".herokuapp.com") ||
      hostname.includes(".heroku.com")
    ) {
      return "heroku";
    }

    // Google Cloud SQL: *.google.cloud or *.cloudsql
    if (
      hostname.includes(".google.cloud") ||
      hostname.includes(".cloudsql")
    ) {
      return "google-cloud-sql";
    }

    // Azure Flexible Server: *.postgres.database.azure.com
    if (hostname.includes(".postgres.database.azure.com")) {
      return "azure-flexible-server";
    }

    // AWS RDS: various patterns
    if (
      hostname.includes(".rds.amazonaws.com") ||
      hostname.endsWith(".db.<region>.amazonaws.com")
    ) {
      return "aws-rds";
    }

    // localhost / local development
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1"
    ) {
      return "loca";
    }

    // Default to generic for unknown providers
    return "generic";
  } catch {
    return "generic";
  }
}

/**
 * Build SSL configuration based on provider requirements.
 */
function buildSslConfig(
  url: string,
  provider: DbProvider
): ProviderConfig["ssl"] {
  // Parse SSL mode from URL
  const parsed = new URL(url);
  const sslMode = parsed.searchParams.get("sslmode")?.toLowerCase();

  // Determine if we should reject unauthorized
  let rejectUnauthorized = true;

  switch (provider) {
    case "supabase":
      // Supabase requires SSL
      rejectUnauthorized =
        sslMode === "disable" || sslMode === "allow" ? false : true;
      break;

    case "neon":
      // Neon requires SSL
      rejectUnauthorized =
        sslMode === "disable" || sslMode === "allow" ? false : true;
      break;

    case "loca":
      // Local development - no SSL needed
      rejectUnauthorized = false;
      break;

    case "railway":
    case "render":
    case "heroku":
      // These providers typically require SSL
      rejectUnauthorized =
        sslMode === "disable" || sslMode === "allow" ? false : true;
      break;

    default:
      // Generic - respect sslmode parameter
      rejectUnauthorized =
        sslMode === "disable" || sslMode === "allow" ? false : true;
  }

  // For verify-ca and verify-full modes, we might need CA cert
  // This is handled by the connection string or environment
  const ca = process.env.PGSSLROOTCERT;

  return {
    rejectUnauthorized,
    ca: ca || undefined,
  };
}

/**
 * Build provider-specific connection options.
 */
function buildProviderOptions(
  provider: DbProvider,
  url: string
): ProviderConfig["options"] {
  const parsed = new URL(url);
  const sslMode = parsed.searchParams.get("sslmode")?.toLowerCase();

  const baseOptions: ProviderConfig["options"] = {
    connectionTimeout: 15000, // 15 seconds default
    keepAlive: true,
  };

  switch (provider) {
    case "supabase":
      return {
        ...baseOptions,
        useConnectionPooler: true,
        poolMode: "transaction" as const,
        // Add libpq compatibility for newer pg versions
        // Supabase uses pg v15+ which has SSL mode changes
        useLibpqCompat: sslMode === "require",
      };

    case "neon":
      return {
        ...baseOptions,
        connectionLimit: 10,
        poolMode: "transaction" as const,
        useLibpqCompat: sslMode === "require",
      };

    case "loca":
      return {
        ...baseOptions,
        connectionTimeout: 5000,
        keepAlive: false,
      };

    case "railway":
    case "render":
    case "heroku":
      return {
        ...baseOptions,
        poolMode: "transaction" as const,
      };

    default:
      return baseOptions;
  }
}

/**
 * Normalize the connection URL for consistent formatting.
 * Adds libpq compatibility parameter if needed.
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Check if libpq compatibility is needed (for pg v9.0.0+ compatibility)
    const sslMode = parsed.searchParams.get("sslmode")?.toLowerCase();
    if (sslMode === "require" || sslMode === "verify-ca" || sslMode === "verify-full") {
      // Add uselibpqcompat=true to maintain current SSL behavior
      // This prevents the security warning in newer pg versions
      parsed.searchParams.set("uselibpqcompat", "true");
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

// ============================================================================
// Export Validation
// ============================================================================

/**
 * Validate that the database configuration is correct.
 */
export function validateDbConfig(config: ProviderConfig): void {
  if (!config.url) {
    throw new Error("Database URL is required");
  }

  try {
    new URL(config.url);
  } catch {
    throw new Error(`Invalid database URL: ${config.url}`);
  }

  // Provider-specific validations
  switch (config.provider) {
    case "supabase":
      if (!config.url.includes(".supabase.co")) {
        throw new Error(
          "Supabase provider requires a Supabase database URL"
        );
      }
      // Supabase requires SSL
      if (!config.url.includes("sslmode=require") && !config.url.includes("sslmode=verify-full")) {
        console.warn(
          "Warning: Supabase recommends using sslmode=require or sslmode=verify-full"
        );
      }
      break;

    case "neon":
      if (!config.url.includes(".neon.tech")) {
        throw new Error("Neon provider requires a Neon database URL");
      }
      break;

    case "loca":
      // Local is fine without SSL
      break;

    default:
      // No specific validation for other providers
      break;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a human-readable description of the current database provider.
 */
export function getProviderDescription(provider: DbProvider): string {
  const descriptions: Record<DbProvider, string> = {
    supabase: "Supabase (serverless PostgreSQL)",
    neon: "Neon (serverless PostgreSQL)",
    loca: "Local PostgreSQL",
    railway: "Railway (managed PostgreSQL)",
    render: "Render (managed PostgreSQL)",
    heroku: "Heroku Postgres",
    "aws-rds": "AWS RDS PostgreSQL",
    "google-cloud-sql": "Google Cloud SQL PostgreSQL",
    "azure-flexible-server": "Azure Flexible Server PostgreSQL",
    generic: "Generic PostgreSQL",
  };

  return descriptions[provider] || "Unknown provider";
}

/**
 * Get provider-specific connection recommendations.
 */
export function getProviderRecommendations(
  provider: DbProvider
): string[] {
  const recommendations: Record<DbProvider, string[]> = {
    supabase: [
      "Use the Session Pooler URI (port 5432) for best performance",
      "Always include ?sslmode=require in the connection string",
      "Consider using connection pooling for high-traffic apps",
    ],
    neon: [
      "Use the connection string from Neon dashboard",
      "Neon uses serverless PostgreSQL - connections are stateless",
      "Consider using connection pooling for sustained workloads",
    ],
    loca: [
      "Use docker-compose or local PostgreSQL installation",
      "No SSL required for local development",
      "Use environment variables to switch between dev/prod",
    ],
    railway: [
      "Use the connection string from Railway dashboard",
      "Railway provides automatic SSL",
    ],
    render: [
      "Use the internal or external connection string from Render",
      "External URL requires SSL",
    ],
    heroku: [
      "Use the DATABASE_URL from Heroku config",
      "Heroku requires SSL - include sslmode=require",
    ],
    "aws-rds": [
      "Use the endpoint from AWS RDS console",
      "Configure security groups to allow access",
      "Use SSL for production (sslmode=verify-full)",
    ],
    "google-cloud-sql": [
      "Use the Cloud SQL Auth Proxy or private IP",
      "Configure IAM authentication if needed",
    ],
    "azure-flexible-server": [
      "Use the server name from Azure portal",
      "Configure firewall rules to allow access",
    ],
    generic: [
      "Ensure the connection string is correct",
      "Configure SSL as needed for your environment",
    ],
  };

  return recommendations[provider] || [];
}
