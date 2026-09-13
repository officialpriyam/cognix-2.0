/**
 * Database reset script with multi-provider support.
 * 
 * Resets the database by dropping all tables and reapplying migrations.
 * Use with caution - this will delete all data!
 * 
 * Usage:
 *   pnpm db:reset              # Reset to last migration state
 *   pnpm db:reset --confirm   # Skip confirmation prompt
 */

import { getDbConfig, getProviderDescription } from "../src/lib/db/config";
import { execSync } from "child_process";
import { createInterface } from "readline";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const maskedPassword = parsed.password ? "****" : "";
    return parsed.protocol + "//" + parsed.username + ":" + maskedPassword + "@" + parsed.host + parsed.pathname;
  } catch {
    return "****";
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("  Database Reset");
  console.log("=".repeat(60));
  console.log();
  console.log("⚠️  WARNING: This will DROP all tables and recreate them!");
  console.log("⚠️  All data will be lost!");
  console.log();

  const config = getDbConfig();

  console.log(`Provider: ${config.provider}`);
  console.log(`Description: ${getProviderDescription(config.provider)}`);
  console.log(`URL: ${maskUrl(config.url)}`);
  console.log();

  // Confirm unless --confirm flag is passed
  const confirmed = process.argv.includes("--confirm") ||
    process.argv.includes("-y") ||
    process.argv.includes("--yes");

  if (!confirmed) {
    const response = await prompt("Type 'RESET' to confirm: ");
    if (response !== "RESET") {
      console.log("❌ Reset cancelled.");
      process.exit(0);
    }
  }

  console.log();
  console.log("🔄 Resetting database...");
  console.log();

  try {
    // For Supabase, use supabase db reset
    if (config.provider === "supabase") {
      console.log("Running: supabase db reset");
      console.log("-".repeat(40));
      execSync("cd supabase && supabase db reset --yes", {
        cwd: rootDir,
        stdio: "inherit",
      });
      console.log("-".repeat(40));
    } else {
      // For other providers, drop and recreate using Drizzle
      console.log("Running: drizzle-kit drop && drizzle-kit push");
      console.log("-".repeat(40));

      // Drop existing tables
      console.log("\n📦 Dropping existing tables...");
      execSync("drizzle-kit drop", {
        cwd: rootDir,
        stdio: "inherit",
      });

      // Push fresh schema
      console.log("\n📦 Pushing schema...");
      execSync("drizzle-kit push", {
        cwd: rootDir,
        stdio: "inherit",
      });

      console.log("-".repeat(40));
    }

    console.log();
    console.log("✅ Database reset complete!");
    console.log();
    console.log("To verify, run:  pnpm db:list-tables");
  } catch (error) {
    console.log();
    console.log("❌ Reset failed:");
    console.log(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Handle --help flag
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Database Reset Script

Usage:
  pnpm db:reset              Reset database (will prompt for confirmation)
  pnpm db:reset --confirm    Reset without confirmation prompt
  pnpm db:reset --yes        Reset without confirmation prompt
  pnpm db:reset --help       Show this help message

⚠️  WARNING: This will delete ALL data in the database!

The script will:
1. Detect your database provider (Supabase, Neon, etc.)
2. For Supabase: Use 'supabase db reset'
3. For other providers: Use 'drizzle-kit drop && drizzle-kit push'
`);
  process.exit(0);
}

const prompt = async (message: string): Promise<string> => {
  process.stdout.write(message);
  const rl = createInterface({ input: process.stdin });
  const answer = await new Promise<string>((resolve) => {
    rl.once("line", (line) => resolve(line));
  });
  rl.close();
  return answer.trim() || "";
};

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
