import { Kysely, sql } from 'kysely';
import { Database } from '../types';
import { getKyselyInstance } from '../kysely.config';

// clear tables for ease of testing different simulated user scenarios

async function clearTables() {
  const db: Kysely<Database> = getKyselyInstance();

  try {
    // Start a transaction
    await db.transaction().execute(async (trx) => {
      // Disable triggers (this will also disable foreign key constraints)
      await trx.executeQuery(
        sql`SET session_replication_role = 'replica';`.compile(db),
      );

      // Clear all tables
      await trx.deleteFrom('asset_daily_prices').execute();
      await trx.deleteFrom('user_assets').execute();
      await trx.deleteFrom('assets').execute();
      await trx.deleteFrom('users').execute();

      // Re-enable triggers
      await trx.executeQuery(
        sql`SET session_replication_role = 'origin';`.compile(db),
      );
    });

    console.log('All tables cleared successfully');
  } catch (error) {
    console.error('Error clearing tables:', error);
  } finally {
    await db.destroy();
  }
}

clearTables().catch(console.error);
