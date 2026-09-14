import fs from "fs";
import mysql from "mysql2/promise";
import { env } from "../config/env.js";

let pool;

const sslConfig = () => {
  if (!env.db.ssl) return undefined;
  const config = { rejectUnauthorized: env.db.sslRejectUnauthorized };
  if (env.db.sslCa) config.ca = env.db.sslCa;
  else if (env.db.sslCaPath) config.ca = fs.readFileSync(env.db.sslCaPath, "utf8");
  return config;
};

/**
 * Returns a mysql2/promise connection pool. Created lazily on first use
 * so importing this module never requires a live database (important for
 * tests and CLI tooling).
 */
export const getPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
      waitForConnections: true,
      connectionLimit: env.db.connectionLimit,
      queueLimit: 0,
      timezone: "Z",
      dateStrings: true,
      charset: "utf8mb4",
      ssl: sslConfig(),
    });
  }
  return pool;
};

/** Releases the pool (used during graceful shutdown). Safe to call once. */
export const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

export default getPool;
