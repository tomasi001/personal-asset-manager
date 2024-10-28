import { Kysely } from 'kysely';
import { Database } from '../types';
import { getKyselyInstance } from '../kysely.config';

// generic seeding script

/**
 * Privy ID Usage for Seeding:
 * 1. Log in to Privy to obtain your access token.
 * 2. Use the token to authenticate through the Swagger API documentation.
 * 3. After first authentication, your Privy ID will be stored in the database.
 * 4. Use this Privy ID in your seed scripts for consistent user simulation across different scenarios.
 */

async function seed() {
  const db: Kysely<Database> = getKyselyInstance();

  try {
    // 1. Create a user
    const [user] = await db
      .insertInto('users')
      .values({
        privy_id: 'did:privy:cm2q101qu0245bdd8oi76rast',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .returning('id')
      .execute();

    // 2. Create multiple assets
    const assets = await db
      .insertInto('assets')
      .values([
        {
          name: 'USDC',
          asset_type: 'ERC-20',
          description: 'USD Coin',
          contract_address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          chain: 'Ethereum',
          created_at: new Date().toISOString(),
        },
        {
          name: 'ETH',
          asset_type: 'ERC-20',
          description: 'Ethereum',
          contract_address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          chain: 'Ethereum',
          created_at: new Date().toISOString(),
        },
        {
          name: 'CryptoPunk #7804',
          asset_type: 'ERC-721',
          description: 'CryptoPunk NFT',
          contract_address: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
          chain: 'Ethereum',
          token_id: '7804',
          created_at: new Date().toISOString(),
        },
      ])
      .returning(['id', 'name'])
      .execute();

    // 3. Create user assets
    const userAssets = assets.map((asset) => ({
      user_id: user.id,
      asset_id: asset.id,
      quantity: asset.name === 'CryptoPunk #7804' ? 1 : 1000, // 1000 for ERC-20, 1 for ERC-721
      created_at: new Date().toISOString(),
    }));

    await db.insertInto('user_assets').values(userAssets).execute();

    // 4. Create asset daily prices (last 30 days)
    const today = new Date();
    const priceEntries = assets.flatMap((asset) =>
      Array.from({ length: 30 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        return {
          asset_id: asset.id,
          price:
            asset.name === 'CryptoPunk #7804'
              ? 100000
              : Math.random() * 1000 + 1,
          recorded_at: date.toISOString(),
        };
      }),
    );

    await db.insertInto('asset_daily_prices').values(priceEntries).execute();

    console.log('Seed data inserted successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await db.destroy();
  }
}

seed().catch(console.error);
