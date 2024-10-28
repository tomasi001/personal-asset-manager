import { Kysely, sql } from 'kysely';
import { Database } from '../types';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('assets')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('asset_type', 'varchar(10)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('contract_address', 'varchar(42)', (col) => col.notNull())
    .addColumn('chain', 'varchar(50)', (col) => col.notNull())
    .addColumn('token_id', 'varchar(100)')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('assets').execute();
}
