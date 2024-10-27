import { Kysely } from 'kysely';
import { Database } from '../types';
import { getKyselyInstance } from '../kysely.config';

// simulate a portfolio with only losing assets

async function seedPortfolioLosses() {
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

    // 2. Create assets
    const assets = await db
      .insertInto('assets')
      .values([
        {
          name: 'LossCoin',
          asset_type: 'ERC-20',
          description: 'A coin that only goes down',
          contract_address: '0x1000000000000000000000000000000000000001',
          chain: 'Ethereum',
          created_at: new Date().toISOString(),
        },
        {
          name: 'DepreciatingNFT',
          asset_type: 'ERC-721',
          description: 'An NFT that loses value',
          contract_address: '0x2000000000000000000000000000000000000002',
          chain: 'Ethereum',
          token_id: '1',
          created_at: new Date().toISOString(),
        },
      ])
      .returning(['id', 'name'])
      .execute();

    // 3. Create user assets
    const userAssets = assets.map((asset) => ({
      user_id: user.id,
      asset_id: asset.id,
      quantity: asset.name === 'DepreciatingNFT' ? 1 : 1000,
      created_at: new Date().toISOString(),
    }));

    await db.insertInto('user_assets').values(userAssets).execute();

    // 4. Create asset daily prices (last 30 days, always decreasing)
    const today = new Date();
    const priceEntries = assets.flatMap((asset) =>
      Array.from({ length: 30 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (29 - i));
        return {
          asset_id: asset.id,
          price:
            asset.name === 'DepreciatingNFT'
              ? 1000 - i * 30 // Starts at 1000, decreases to 130
              : 100 - i * 3, // Starts at 100, decreases to 13
          recorded_at: date.toISOString().split('T')[0],
        };
      }),
    );

    await db.insertInto('asset_daily_prices').values(priceEntries).execute();

    console.log('Seed data for portfolio with losses inserted successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await db.destroy();
  }
}

seedPortfolioLosses().catch(console.error);
