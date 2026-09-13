/**
 * Database backup script.
 * 
 * Creates a backup of the database schema and optionally data.
 * Supports any PostgreSQL provider.
 * 
 * Usage:
 *   pnpm db:backup                  # Backup schema only
 *   pnpm db:backup --data          # Backup schema + data
 *   pnpm db:backup --output ./backup.sql   # Custom output file
 */

import { getDbConfig } from "../src/lib/db/config";
import { Pool } from "pg";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { writeFileSync, mkdirSync, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

async function main() {
  const config = getDbConfig();
  const includeData = process.argv.includes("--data");
  const customOutput = process.argv.includes("--output")
    ? process.argv[process.argv.indexOf("--output") + 1]
    : null;

  console.log("=".repeat(60));
  console.log("  Database Backup");
  console.log("=".repeat(60));
  console.log();
  console.log(`Provider: ${config.provider}`);
  console.log();

  // Determine output file
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const defaultOutput = resolve(rootDir, "backups", `backup-${timestamp}.sql`);
  const outputFile = customOutput || defaultOutput;

  // Ensure backups directory exists
  const backupsDir = resolve(rootDir, "backups");
  if (!existsSync(backupsDir)) {
    mkdirSync(backupsDir, { recursive: true });
  }

  console.log(`Output: ${outputFile}`);
  console.log(`Include data: ${includeData ? "Yes" : "No (schema only)"}`);
  console.log();

  const pool = new Pool({
    connectionString: config.url,
    ssl: config.ssl ? {
      rejectUnauthorized: config.ssl.rejectUnauthorized,
      ca: config.ssl.ca,
    } : undefined,
  });

  try {
    console.log("📦 Creating backup...");
    console.log();

    const backupContent = await generateBackup(pool, includeData);
    writeFileSync(outputFile, backupContent, "utf8");

    const fileSize = Buffer.byteLength(backupContent, "utf8");
    console.log();
    console.log("✅ Backup complete!");
    console.log(`   File: ${outputFile}`);
    console.log(`   Size: ${formatBytes(fileSize)}`);
    console.log();

  } catch (error) {
    console.error("❌ Backup failed:");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Generate SQL backup content.
 */
async function generateBackup(pool: Pool, includeData: boolean): Promise<string> {
  const lines: string[] = [];

  // Header
  lines.push("-- ============================================================================");
  lines.push("-- Database Backup");
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- Provider: ${config.provider}`);
  lines.push("-- ============================================================================");
  lines.push("");
  lines.push("-- Disable foreign key checks during restore");
  lines.push("SET session_replication_role = 'replica';");
  lines.push("");

  // Get all tables
  const tablesResult = await pool.query(`
    SELECT table_name, table_schema
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  // Generate schema for each table
  for (const table of tablesResult.rows) {
    lines.push(`-- ============================================================================`);
    lines.push(`-- Table: ${table.table_name}`);
    lines.push("-- ============================================================================");
    lines.push("");

    // Get CREATE TABLE statement from pg_get_tabledef (PostgreSQL 12+)
    // Fallback to manual schema extraction for older versions
    const createTable = await pool.query(`
      SELECT 
        obj_description(format('%I.%I', table_schema, table_name)::regclass) as description,
        pg_get_tabledef(format('%I.%I', table_schema, table_name)::regclass) as def
      FROM information_schema.tables
      WHERE table_schema = $1 AND table_name = $2
    `, [table.table_schema, table.table_name]);

    if (createTable.rows[0]?.def) {
      lines.push(createTable.rows[0].def);
    } else {
      // Fallback: generate basic CREATE TABLE
      const columns = await pool.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `, [table.table_schema, table.table_name]);

      let createSql = `CREATE TABLE "${table.table_name}" (\n`;
      const columnDefs = columns.rows.map((col) => {
        let def = `  "${col.column_name}" ${col.data_type}`;
        if (col.character_maximum_length) {
          def += `(${col.character_maximum_length})`;
        }
        if (col.is_nullable === "NO") {
          def += " NOT NULL";
        }
        if (col.column_default) {
          def += ` DEFAULT ${col.column_default}`;
        }
        return def;
      });
      createSql += columnDefs.join(",\n");
      createSql += "\n);";
      lines.push(createSql);
    }

    lines.push("");

    // Include data if requested
    if (includeData) {
      lines.push("-- Data for ${table.table_name}");
      lines.push("");

      const dataResult = await pool.query(`SELECT * FROM "${table.table_name}"`);

      if (dataResult.rows.length > 0) {
        lines.push(`INSERT INTO "${table.table_name}" VALUES`);
        const valuesList = dataResult.rows.map((row) => {
          const values = Object.values(row).map((v) => {
            if (v === null) return "NULL";
            if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
            return `'${String(v).replace(/'/g, "''")}'`;
          });
          return `(${values.join(", ")})`;
        });
        lines.push(valuesList.join(";\n") + ";");
      }

      lines.push("");
    }
  }

  // Footer
  lines.push("");
  lines.push("-- Re-enable foreign key checks");
  lines.push("SET session_replication_role = 'origin';");
  lines.push("");
  lines.push("-- ============================================================================");
  lines.push("-- End of Backup");
  lines.push("-- ============================================================================");

  return lines.join("\n");
}

/**
 * Format bytes to human-readable string.
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

const config = getDbConfig();
main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
