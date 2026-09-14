import { migrate } from "./migrate.js";
import { seed } from "./seed.js";

/** Runs migrations and seeds, then exits. CLI: node run.js [--seed-only|--migrate-only] */
const arg = process.argv[2];
const run = async () => {
  if (arg === "--seed-only") {
    await seed();
  } else if (arg === "--migrate-only") {
    await migrate();
  } else {
    await migrate();
    await seed();
  }
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
