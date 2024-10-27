import * as path from 'path';
import { Pool } from 'pg';
import { promises as fs } from 'fs';
import {
  Kysely,
  Migrator,
  PostgresDialect,
  FileMigrationProvider,
} from 'kysely';
import { Database } from '../types';

async function migrateToLatest() {
  // Check for required environment variables
  if (
    !process.env.DB_HOST ||
    !process.env.DB_DATABASE ||
    !process.env.DB_USERNAME ||
    !process.env.DB_PASSWORD
  ) {
    console.error(
      'Missing required environment variables: DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD',
    );
    process.exit(1);
  }

  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
      }),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`Migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === 'Error') {
      console.error(`Failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error('Failed to migrate');
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
}

// Execute the migration
migrateToLatest().catch((err) => {
  console.error('Migration script encountered an error:', err);
  process.exit(1);
});
