import { defineConfig } from "drizzle-kit";
import { getDbConfig, validateDbConfig } from "./src/lib/db/config";

// Load and validate database configuration
const dbConfig = getDbConfig();
validateDbConfig(dbConfig);

const schema = "./src/lib/db/pg/schema.pg.ts";
const out = "./src/lib/db/migrations/pg";

export default defineConfig({
  schema,
  out,
  dialect: "postgresql",
  migrations: {},
  dbCredentials: {
    url: dbConfig.url,
  },
});
