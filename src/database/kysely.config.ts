// src/database/kysely.config.ts
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { Database } from './types';

// Singleton instance for Kysely
let db: Kysely<Database> | null = null;

// Create the Pool only once to be used across the application
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'asset_manager_db',
  max: 10, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30s
  connectionTimeoutMillis: 2000, // Return an error if connection takes longer than 2s
});

export function getKyselyInstance(): Kysely<Database> {
  if (!db) {
    try {
      db = new Kysely<Database>({ dialect: new PostgresDialect({ pool }) });
    } catch (error) {
      console.error('Failed to create Kysely instance:', error);
      throw error;
    }
  }
  return db;
}
