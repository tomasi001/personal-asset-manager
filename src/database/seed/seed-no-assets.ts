import { Kysely } from 'kysely';
import { Database } from '../types';
import { getKyselyInstance } from '../kysely.config';

// simulate a user with no assets

/**
 * Privy ID Usage for Seeding:
 * 1. Log in to Privy to obtain your access token.
 * 2. Use the token to authenticate through the Swagger API documentation.
 * 3. After first authentication, your Privy ID will be stored in the database.
 * 4. Use this Privy ID in your seed scripts for consistent user simulation across different scenarios.
 */

async function seedNoAssets() {
  const db: Kysely<Database> = getKyselyInstance();

  try {
    // Create a user with no assets
    await db
      .insertInto('users')
      .values({
        privy_id: 'did:privy:cm2q101qu0245bdd8oi76rast',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .execute();

    console.log('Seed data for user with no assets inserted successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await db.destroy();
  }
}

seedNoAssets().catch(console.error);
