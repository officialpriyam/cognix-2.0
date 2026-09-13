import { DISABLE_AUTO_MIGRATE, IS_VERCEL_ENV } from "lib/const";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!IS_VERCEL_ENV) {
      // run DB migration
      if (DISABLE_AUTO_MIGRATE) {
        console.log(
          "⏭️ DISABLE_AUTO_MIGRATE=true — skipping boot-time database migrations.",
        );
      } else {
        const runMigrate = await import("./lib/db/pg/migrate.pg").then(
          (m) => m.runMigrate,
        );
        await runMigrate().catch((_e) => {
          // Full error and hints already logged by runMigrate.
          console.error(
            "🚨 Startup aborted: database migrations failed, so the server " +
              "cannot serve requests. Fix POSTGRES_URL / network access and " +
              "redeploy. You can also set DISABLE_AUTO_MIGRATE=true to skip " +
              "boot-time migrations entirely. (The 'No open ports detected' " +
              "line in the deploy log is a consequence of this exit, not a " +
              "separate problem.)",
          );
          process.exit(1);
        });
      }
      const initMCPManager = await import("./lib/ai/mcp/mcp-manager").then(
        (m) => m.initMCPManager,
      );
      await initMCPManager();
    }
  }
}
