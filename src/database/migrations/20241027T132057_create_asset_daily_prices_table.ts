import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('asset_daily_prices')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('asset_id', 'uuid', (col) =>
      col.references('assets.id').onDelete('cascade'),
    )
    .addColumn('price', 'numeric(20, 6)', (col) => col.notNull())
    .addColumn('recorded_at', 'date', (col) => col.notNull())
    .addUniqueConstraint('uq_asset_recorded_at', ['asset_id', 'recorded_at'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('asset_daily_prices').execute();
}
