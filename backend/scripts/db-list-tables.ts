/**
 * List all tables in the database.
 * 
 * Works with any PostgreSQL provider (Supabase, Neon, etc.)
 * 
 * Usage:
 *   pnpm db:list-tables       # List all user tables
 *   pnpm db:list-tables --schema public   # List tables in specific schema
 */

import { getDbConfig } from "../src/lib/db/config";
import { Pool } from "pg";

async function main() {
  const config = getDbConfig();

  console.log("=".repeat(60));
  console.log("  Database Tables");
  console.log("=".repeat(60));
  console.log();
  console.log(`Provider: ${config.provider}`);
  console.log(`URL: ${maskUrl(config.url)}`);
  console.log();

  const pool = new Pool({
    connectionString: config.url,
    ssl: config.ssl ? {
      rejectUnauthorized: config.ssl.rejectUnauthorized,
      ca: config.ssl.ca,
    } : undefined,
  });

  try {
    // Get target schema from args or default to public
    const targetSchema = process.argv.includes("--schema")
      ? process.argv[process.argv.indexOf("--schema") + 1] || "public"
      : "public";

    console.log(`Schema: ${targetSchema}`);
    console.log();
    console.log("-".repeat(60));

    // Query to list tables with details
    const query = `
      SELECT 
        t.table_name,
        t.table_schema,
        CASE 
          WHEN t.table_type = 'BASE TABLE' THEN 'table'
          WHEN t.table_type = 'VIEW' THEN 'view'
          ELSE t.table_type
        END as type,
        pg_size_pretty(pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as size,
        (SELECT count(*) FROM information_schema.columns c WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name) as columns,
        obj_description(format('%I.%I', t.table_schema, t.table_name)::regclass) as description
      FROM information_schema.tables t
      WHERE t.table_schema = $1
        AND t.table_type IN ('BASE TABLE', 'VIEW')
      ORDER BY t.table_name
    `;

    const result = await pool.query(query, [targetSchema]);

    if (result.rows.length === 0) {
      console.log("No tables found in schema.");
    } else {
      console.log();
      console.log(
        `${result.rows.length} table(s) found:\n`
      );

      result.rows.forEach((row) => {
        console.log(`  ${row.table_name.padEnd(35)} ${row.type.padEnd(8)} ${row.size.padEnd(10)} (${row.columns} cols)`);
        if (row.description) {
          console.log(`  ${" ".repeat(35)} ${"=".repeat(20)}`);
          console.log(`  ${" ".repeat(35)} ${row.description}`);
        }
      });
    }

    console.log();
    console.log("-".repeat(60));

    // Show table details if requested
    if (process.argv.includes("--details")) {
      console.log("\n📋 Table Details:\n");

      for (const row of result.rows) {
        console.log(`\n▸ ${row.table_name}`);
        console.log("-".repeat(40));

        const cols = await pool.query(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            CASE WHEN pk.column_name IS NOT NULL THEN 'PRI' ELSE '' END as key
          FROM information_schema.columns c
          LEFT JOIN (
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_schema = $1 
              AND tc.table_name = $2
              AND tc.constraint_type = 'PRIMARY KEY'
          ) pk ON c.column_name = pk.column_name
          WHERE c.table_schema = $1 AND c.table_name = $2
          ORDER BY c.ordinal_position
        `, [targetSchema, row.table_name]);

        cols.rows.forEach((col) => {
          const nullable = col.is_nullable === "YES" ? "NULL" : "NOT NULL";
          const defaultVal = col.column_default ? `= ${col.column_default}` : "";
          const key = col.key ? ` [${col.key}]` : "";
          console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(15)} ${nullable.padEnd(10)} ${defaultVal.padEnd(20)} ${key}`);
        });
      }
    }

    console.log();
    console.log("=".repeat(60));

  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await pool.end();
  }
}

function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const maskedPassword = parsed.password ? "****" : "";
    return parsed.protocol + "//" + parsed.username + ":" + maskedPassword + "@" + parsed.host + parsed.pathname;
  } catch {
    return "****";
  }
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
