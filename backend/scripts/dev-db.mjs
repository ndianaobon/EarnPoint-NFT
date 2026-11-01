// Runs a private PostgreSQL for local development, stored in backend/.data.
// It needs no install or Docker. Production must use a managed PostgreSQL instead.
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dataDir = fileURLToPath(new URL("../.data/postgres", import.meta.url));
const port = Number(process.env.DEV_DB_PORT ?? 5433);
const databases = (process.env.DEV_DB_NAMES ?? "earnpoint,earnpoint_test").split(",");

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "earnpoint",
  password: "earnpoint-local-dev",
  port,
  persistent: true,
  onLog: () => {},
  onError: (message) => console.error(String(message)),
});

const isNew = !existsSync(dataDir);
if (isNew) await pg.initialise();
await pg.start();

for (const name of databases) {
  try {
    await pg.createDatabase(name);
    console.log(`Created database ${name}`);
  } catch (error) {
    if (error?.code !== "42P04") throw error; // 42P04: it already exists.
  }
}

console.log(`PostgreSQL ready on port ${port}. Press Ctrl+C to stop.`);

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
