import { IS_VERCEL_ENV } from "lib/const";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!IS_VERCEL_ENV) {
      // run DB migration
      const runMigrate = await import("./lib/db/pg/migrate.pg").then(
        (m) => m.runMigrate,
      );
      await runMigrate().catch((_e) => { // full error already logged by runMigrate
        console.error(
          "🚨 Startup aborted: database migrations failed, so the server " +
            "cannot serve requests. Fix POSTGRES_URL / network access and " +
            "redeploy. (The 'No open ports detected' line in the deploy log " +
            "is a consequence of this exit, not a separate problem.)",
        );
        process.exit(1);
      });
      const initMCPManager = await import("./lib/ai/mcp/mcp-manager").then(
        (m) => m.initMCPManager,
      );
      await initMCPManager();
    }
  }
}
