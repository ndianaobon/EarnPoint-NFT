import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type pg from "pg";

const MIGRATIONS_DIR = fileURLToPath(new URL("../../migrations", import.meta.url));
const LOCK_ID = 7238401;

// Applies each new .sql file once, in order. Editing a file that has already run is
// an error: schema changes must always be new migrations.
export async function runMigrations(pool: pg.Pool): Promise<string[]> {
  const client = await pool.connect();
  const applied: string[] = [];
  try {
    await client.query("SELECT pg_advisory_lock($1)", [LOCK_ID]);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const { rows } = await client.query<{ name: string; checksum: string }>(
      "SELECT name, checksum FROM schema_migrations",
    );
    const done = new Map(rows.map((row) => [row.name, row.checksum]));

    const files = (await readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith(".sql")).sort();
    for (const file of files) {
      const sql = (await readFile(path.join(MIGRATIONS_DIR, file), "utf8")).replace(/\r\n/g, "\n");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const previous = done.get(file);
      if (previous) {
        if (previous !== checksum) throw new Error(`Migration ${file} changed after being applied`);
        continue;
      }
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)", [
          file,
          checksum,
        ]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${file} failed: ${(error as Error).message}`);
      }
      applied.push(file);
    }
    return applied;
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]);
    client.release();
  }
}
