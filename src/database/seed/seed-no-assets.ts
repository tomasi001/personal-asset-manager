import { Kysely } from 'kysely';
import { Database } from '../types';
import { getKyselyInstance } from '../kysely.config';

// simulate a user with no assets

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
