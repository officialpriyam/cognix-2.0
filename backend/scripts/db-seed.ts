/**
 * Database seed script template.
 * 
 * Run this script to seed the database with initial data.
 * Customize the seedData object with your actual seed data.
 * 
 * Usage:
 *   pnpm db:seed              # Run seed script
 *   pnpm db:seed --clear      # Clear existing data before seeding
 */

import { getDbConfig } from "../src/lib/db/config";
import { Pool } from "pg";

// ============================================================================
// Seed Data Configuration
// ============================================================================
// Customize this with your actual seed data
// ============================================================================

interface SeedConfig {
  enabled: boolean;
  clearBeforeSeed: boolean;
  data: Record<string, unknown>[];
}

const seedConfig: SeedConfig = {
  enabled: true,
  clearBeforeSeed: process.argv.includes("--clear"),
  data: [
    // Example: Add your seed data here
    // {
    //   table: "user",
    //   data: {
    //     id: "uuid",
    //     name: "Admin User",
    //     email: "admin@example.com",
    //     emailVerified: true,
    //     role: "admin",
    //   },
    // },
  ],
};

// ============================================================================

async function main() {
  const config = getDbConfig();

  console.log("=".repeat(60));
  console.log("  Database Seed");
  console.log("=".repeat(60));
  console.log();
  console.log(`Provider: ${config.provider}`);
  console.log();

  if (!seedConfig.enabled) {
    console.log("❌ Seeding is disabled. Enable in scripts/db-seed.ts");
    process.exit(0);
  }

  if (seedConfig.data.length === 0) {
    console.log("ℹ️  No seed data configured.");
    console.log("   Add data to scripts/db-seed.ts to enable seeding.");
    process.exit(0);
  }

  const pool = new Pool({
    connectionString: config.url,
    ssl: config.ssl ? {
      rejectUnauthorized: config.ssl.rejectUnauthorized,
      ca: config.ssl.ca,
    } : undefined,
  });

  try {
    // Optionally clear existing data
    if (seedConfig.clearBeforeSeed) {
      console.log("🧹 Clearing existing data...");
      await clearTables(pool);
      console.log();
    }

    // Seed data
    console.log(`🌱 Seeding ${seedConfig.data.length} record(s)...`);
    console.log();

    for (const item of seedConfig.data) {
      await seedRecord(pool, item as { table: string; data: Record<string, unknown> });
    }

    console.log("✅ Seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Clear all data from tables.
 */
async function clearTables(pool: Pool): Promise<void> {
  // Get all tables in public schema
  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  // Disable foreign key checks temporarily
  await pool.query("SET session_replication_role = 'replica'");

  for (const row of result.rows) {
    await pool.query(`DELETE FROM "${row.table_name}"`);
    console.log(`   ✓ Cleared ${row.table_name}`);
  }

  // Re-enable foreign key checks
  await pool.query("SET session_replication_role = 'origin'");
}

/**
 * Seed a single record.
 */
async function seedRecord(
  pool: Pool,
  item: { table: string; data: Record<string, unknown> }
): Promise<void> {
  const { table, data } = item;

  console.log(`   → ${table}:`);

  // Generate INSERT statement
  const columns = Object.keys(data).join(", ");
  const values = Object.values(data)
    .map((v) => {
      if (v === null || v === undefined) return "NULL";
      if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
      return JSON.stringify(v);
    })
    .join(", ");

  try {
    await pool.query(`INSERT INTO "${table}" (${columns}) VALUES (${values})`);
    console.log(`      ✓ Inserted`);
  } catch (error) {
    console.log(`      ⚠ Skipped: ${error instanceof Error ? error.message : String(error)}`);
  }
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
