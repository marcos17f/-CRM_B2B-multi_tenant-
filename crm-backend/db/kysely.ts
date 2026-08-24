import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { Database } from './types';

export function createKysely(connectionString: string): Kysely<Database> {
  const dialect = new PostgresDialect({
    pool: new Pool({ connectionString, max: 10 }),
  });

  return new Kysely<Database>({
    dialect,
    plugins: [new CamelCasePlugin()],
  });
}

export type { Database };
