/**
 * Database push script with multi-provider support.
 * 
 * This script handles pushing database migrations to any PostgreSQL provider
 * including Supabase, Neon, Railway, Render, Heroku, AWS RDS, etc.
 * 
 * Usage:
 *   pnpm db:push              # Push to configured provider
 *   pnpm db:push --dry-run   # Show what would be pushed without executing
 */

import { getDbConfig, getProviderDescription, getProviderRecommendations } from "../src/lib/db/config";
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, copyFileSync, readdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const supabaseMigrationsDir = resolve(rootDir, "supabase", "migrations");
const drizzleMigrationsDir = resolve(rootDir, "src", "lib", "db", "migrations", "pg");

async function main() {
  console.log("=".repeat(60));
  console.log("  Database Migration Pusher");
  console.log("=".repeat(60));
  console.log();

  // Load configuration
  const config = getDbConfig();

  console.log(`📍 Provider:     ${config.provider}`);
  console.log(`📍 Description: ${getProviderDescription(config.provider)}`);
  console.log(`🔗 URL:         ${maskUrl(config.url)}`);
  console.log();

  // Check for new migrations in Drizzle folder
  const drizzleMigrations = getMigrationFiles(drizzleMigrationsDir);
  const supabaseMigrations = getMigrationFiles(supabaseMigrationsDir);

  console.log(`📦 Drizzle migrations:  ${drizzleMigrations.length} files`);
  console.log(`📦 Supabase migrations: ${supabaseMigrations.length} files`);
  console.log();

  // Find new migrations that haven't been synced
  const newMigrations = findNewMigrations(drizzleMigrations, supabaseMigrations);

  if (newMigrations.length === 0) {
    console.log("✅ No new migrations to sync.");
    console.log();
  } else {
    console.log(`📝 Found ${newMigrations.length} new migration(s):`);
    newMigrations.forEach((m) => console.log(`   - ${m}`));
    console.log();

    // Copy new migrations to Supabase folder
    console.log("🔄 Syncing migrations to supabase/migrations/...");
    newMigrations.forEach((file) => {
      const src = resolve(drizzleMigrationsDir, file);
      const dst = resolve(supabaseMigrationsDir, file);
      copyFileSync(src, dst);
      console.log(`   ✓ ${file}`);
    });
    console.log();
  }

  // Show recommendations for the provider
  const recommendations = getProviderRecommendations(config.provider);
  if (recommendations.length > 0) {
    console.log("💡 Provider recommendations:");
    recommendations.forEach((r) => console.log(`   • ${r}`));
    console.log();
  }

  // Check if we should push to Supabase
  const pushToSupabase = shouldPushToSupabase(config.provider);

  if (pushToSupabase) {
    console.log("📤 Pushing to Supabase...");
    console.log();

    try {
      // Check if supabase is linked
      try {
        execSync("supabase status", { cwd: rootDir, stdio: "pipe" });
      } catch {
        console.log("⚠️  Supabase not linked. Linking now...");
        const projectRef = process.env.SUPABASE_PROJECT_REF;
        if (!projectRef) {
          console.log("❌ SUPABASE_PROJECT_REF not set");
          console.log("   Set it in .env or run: supabase link --project-ref <ref>");
          process.exit(1);
        }
        execSync(`supabase link --project-ref ${projectRef}`, {
          cwd: rootDir,
          stdio: "inherit",
        });
        console.log();
      }

      // Push migrations
      console.log("Running: supabase db push");
      console.log("-".repeat(40));
      execSync("cd supabase && supabase db push", {
        cwd: rootDir,
        stdio: "inherit",
      });
      console.log("-".repeat(40));
      console.log();
      console.log("✅ Supabase push complete!");
    } catch (error) {
      console.log();
      console.log("❌ Supabase push failed:");
      console.log(error instanceof Error ? error.message : String(error));
      console.log();
      console.log("💡 Alternative: Push directly with Drizzle:");
      console.log("   pnpm db:push:drizzle");
      process.exit(1);
    }
  } else {
    // For non-Supabase providers, use Drizzle directly
    console.log("📤 Pushing directly via Drizzle...");
    console.log();

    try {
      console.log("Running: drizzle-kit push");
      console.log("-".repeat(40));
      execSync("drizzle-kit push", {
        cwd: rootDir,
        stdio: "inherit",
      });
      console.log("-".repeat(40));
      console.log();
      console.log("✅ Direct push complete!");
    } catch (error) {
      console.log();
      console.log("❌ Direct push failed:");
      console.log(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  // Summary
  console.log();
  console.log("=".repeat(60));
  console.log("  Summary");
  console.log("=".repeat(60));
  console.log(`Provider:    ${config.provider}`);
  console.log(`Migrations:  ${drizzleMigrations.length} total, ${newMigrations.length} new`);
  console.log(`Status:      ✅ Complete`);
  console.log();
  console.log("To verify, run:  pnpm db:list-tables");
  console.log("=".repeat(60));
}

/**
 * Mask sensitive parts of the URL for display.
 */
function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const maskedPassword = parsed.password ? "****" : "";
    return parsed.protocol + "//" + parsed.username + ":" + maskedPassword + "@" + parsed.host + parsed.pathname;
  } catch {
    return "****";
  }
}

/**
 * Get list of migration files from a directory.
 */
function getMigrationFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql") && !f.startsWith("meta"))
    .sort();
}

/**
 * Find new migrations that exist in Drizzle but not in Supabase.
 */
function findNewMigrations(
  drizzle: string[],
  supabase: string[]
): string[] {
  const supabaseSet = new Set(supabase);
  return drizzle.filter((f) => !supabaseSet.has(f));
}

/**
 * Determine if we should push to Supabase or use direct Drizzle push.
 */
function shouldPushToSupabase(provider: string): boolean {
  // Supabase-specific provider
  if (provider === "supabase") {
    return true;
  }

  // Check if user explicitly wants Supabase push
  const forceSupabase = process.argv.includes("--supabase");
  if (forceSupabase) {
    return true;
  }

  // Check if it's a local or generic provider - use direct push
  if (provider === "loca" || provider === "generic") {
    return false;
  }

  // For other providers, try Supabase first, fall back to direct
  // This can be configured via environment
  const defaultToDirect = process.env.DB_PUSH_DIRECT === "true";
  return !defaultToDirect;
}

// Handle dry-run flag
const dryRun = process.argv.includes("--dry-run");
if (dryRun) {
  console.log("🔍 DRY RUN - No changes will be made");
  console.log();

  const config = getDbConfig();
  console.log(`Provider: ${config.provider}`);
  console.log(`URL: ${maskUrl(config.url)}`);

  const drizzleMigrations = getMigrationFiles(drizzleMigrationsDir);
  const supabaseMigrations = getMigrationFiles(supabaseMigrationsDir);
  const newMigrations = findNewMigrations(drizzleMigrations, supabaseMigrations);

  console.log();
  console.log(`New migrations would be synced: ${newMigrations.length}`);
  newMigrations.forEach((m) => console.log(`  - ${m}`));

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
