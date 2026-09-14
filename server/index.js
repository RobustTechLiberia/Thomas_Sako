import { env } from "./config/env.js";
import { runMigrations } from "./db/index.js";
import { getPool, closePool } from "./db/pool.js";
import { getServices } from "./services/index.js";

const shutdown = async (server, hub) => {
  console.log("\nShutting down…");
  try {
    hub.closeAll();
  } catch (err) {
    console.error("Error closing hub:", err.message);
  }
  server.close(async () => {
    try {
      await closePool();
    } catch (err) {
      console.error("Error closing database pool:", err.message);
    }
    console.log("Server closed. Exiting.");
    process.exit(0);
  });
  // Force-exit if connections linger.
  setTimeout(() => process.exit(1), 5000).unref();
};

const start = async () => {
  try {
    const { runSeeds } = await import("./db/index.js");
    await runMigrations();
    const services = getServices();
    await services.contentService.seedDefaults();
    await runSeeds();

    const { createApp } = await import("./app.js");
    const app = createApp({ services });
    const server = app.listen(env.port, () => {
      console.log(`✓ CMS server listening on http://localhost:${env.port}`);
      console.log(`  Public app: ${env.clientUrl || "(not served by this process)"}`);
    });

    for (const signal of ["SIGINT", "SIGTERM"]) {
      process.on(signal, () => shutdown(server, services.hub));
    }
  } catch (err) {
    console.error("Failed to start CMS server:", err);
    process.exit(1);
  }
};

start();
