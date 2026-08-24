/**
 * Runner de migrations simples e explícito — sem depender de nenhuma ferramenta externa
 * com binário compilado (o ambiente onde este projeto foi originalmente montado não tinha
 * acesso à rede para baixar engines nativos, então a stack toda usa só pacotes 100% JS/TS:
 * pg + Kysely). Aplica em ordem alfabética os arquivos de db/migrations/*.sql que ainda
 * não estão registrados em `_migrations`, cada um dentro de uma transação.
 *
 * Uso: npm run db:migrate
 */
import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL não definido (copie .env.example para .env)');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query(`
      create table if not exists _migrations (
        name        text primary key,
        applied_at  timestamptz not null default now()
      )
    `);

    const dir = join(__dirname, 'migrations');
    const files = readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const { rows: applied } = await client.query<{ name: string }>('select name from _migrations');
    const appliedNames = new Set(applied.map((r) => r.name));

    for (const file of files) {
      if (appliedNames.has(file)) {
        console.log(`↷ já aplicada: ${file}`);
        continue;
      }

      const sql = readFileSync(join(dir, file), 'utf-8');
      console.log(`▶ aplicando: ${file}`);
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('insert into _migrations (name) values ($1)', [file]);
        await client.query('commit');
        console.log(`✓ ok: ${file}`);
      } catch (err) {
        await client.query('rollback');
        throw new Error(`falha ao aplicar ${file}: ${(err as Error).message}`);
      }
    }

    console.log('Migrations em dia.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
