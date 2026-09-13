import { migrate } from "drizzle-orm/node-postgres/migrator";
import { join } from "path";
import { pgDb } from "lib/db/pg/db.pg";

// Walk the error's cause chain (drizzle wraps the driver error) and collect
// the driver error codes (e.g. ENETUNREACH) plus the target address.
function collectConnectInfo(err: unknown): {
  codes: string[];
  address?: string;
} {
  const codes: string[] = [];
  let address: string | undefined;
  let current: unknown = err;
  for (let depth = 0; depth < 5 && current; depth++) {
    const candidate = current as {
      code?: string;
      address?: string;
      cause?: unknown;
    };
    if (candidate.code) codes.push(candidate.code);
    if (!address && candidate.address) address = candidate.address;
    current = candidate.cause;
  }
  return { codes, address };
}

function connectionTroubleshooting(err: unknown): string[] {
  const { codes, address } = collectConnectInfo(err);
  const hints: string[] = [];

  if (codes.includes("ENETUNREACH") || codes.includes("EHOSTUNREACH")) {
    if (address?.includes(":")) {
      // IPv6 address (contains ":"): the runtime has no IPv6 route.
      hints.push(
        `The database host resolved to the IPv6 address ${address}, but this runtime has no IPv6 network route (Render and most CI runners are IPv4-only).`,
        "If you use Supabase, replace the direct connection URL (db.<project-ref>.supabase.co — IPv6-only) with the Session pooler URI: postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require (the pooler username has a dot after 'postgres').",
      );
    } else {
      hints.push(
        "The database host is unreachable from this machine. Check that the Postgres instance is running, that POSTGRES_URL has the right host/port, and that no firewall blocks outbound connections.",
      );
    }
  } else if (codes.includes("ECONNREFUSED")) {
    hints.push(
      "Connection refused: the host was reachable but nothing is listening on that port. Check that the Postgres instance is running and that POSTGRES_URL uses the correct port.",
    );
  } else if (codes.includes("ETIMEDOUT") || codes.includes("ECONNRESET")) {
    hints.push(
      "Connection timed out: the host is likely firewalled. Allow inbound connections from this machine (Supabase: Project Settings → Database → Network; Render Postgres: enable external access).",
    );
  } else if (codes.includes("ENOTFOUND")) {
    hints.push(
      "DNS lookup failed: the hostname in POSTGRES_URL does not resolve. Double-check the connection string.",
    );
  }

  if (codes.length === 0) {
    hints.push(
      "Check that the Postgres instance is running and that POSTGRES_URL points at the right database.",
    );
  }

  return hints;
}

export const runMigrate = async () => {
  console.log("⏳ Running PostgreSQL migrations...");

  const start = Date.now();
  await migrate(pgDb, {
    migrationsFolder: join(process.cwd(), "src/lib/db/migrations/pg"),
  }).catch((err) => {
    console.error("❌ PostgreSQL migrations failed.");
    for (const hint of connectionTroubleshooting(err)) {
      console.error(`   → ${hint}`);
    }
    throw err;
  });
  const end = Date.now();

  console.log("✅ PostgreSQL migrations completed in", end - start, "ms");
};
