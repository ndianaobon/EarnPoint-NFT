import { Inject, Injectable, type OnModuleDestroy } from "@nestjs/common";
import pg from "pg";
import { CONFIG, type AppConfig } from "../config.js";

export type Queryable = {
  query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<pg.QueryResult<T>>;
};

@Injectable()
export class Db implements OnModuleDestroy, Queryable {
  readonly pool: pg.Pool;

  constructor(@Inject(CONFIG) config: AppConfig) {
    this.pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 });
  }

  query<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, values?: unknown[]) {
    return this.pool.query<T>(text, values);
  }

  async tx<T>(work: (client: Queryable) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  onModuleDestroy() {
    return this.pool.end();
  }
}
