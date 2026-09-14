import { migrate } from "./migrate.js";
import { seed } from "./seed.js";

export const runMigrations = async (options = {}) => {
  if (options.skip) return;
  await migrate();
};

export const runSeeds = async (options = {}) => {
  if (options.skip) return;
  await seed();
};

export default { runMigrations, runSeeds };
