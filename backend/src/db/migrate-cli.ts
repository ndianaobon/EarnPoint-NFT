import pg from "pg";
import { loadConfig } from "../config.js";
import { runMigrations } from "./migrate.js";

const config = loadConfig();
const pool = new pg.Pool({ connectionString: config.databaseUrl });
try {
  const applied = await runMigrations(pool);
  console.log(applied.length ? `Applied: ${applied.join(", ")}` : "Database is up to date.");
} finally {
  await pool.end();
}
