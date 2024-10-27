import { Kysely } from 'kysely';
import { Database } from '../types';
import { getKyselyInstance } from '../kysely.config';

// simulate portfolio with a mix of gaining, losing, and stable assets
async function seedMixedPortfolio() {
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
          name: 'GainCoin',
          asset_type: 'ERC-20',
          description: 'A coin that goes up',
          contract_address: '0x3000000000000000000000000000000000000003',
          chain: 'Ethereum',
          created_at: new Date().toISOString(),
        },
        {
          name: 'LossCoin',
          asset_type: 'ERC-20',
          description: 'A coin that goes down',
          contract_address: '0x4000000000000000000000000000000000000004',
          chain: 'Ethereum',
          created_at: new Date().toISOString(),
        },
        {
          name: 'StableNFT',
          asset_type: 'ERC-721',
          description: 'An NFT with stable value',
          contract_address: '0x5000000000000000000000000000000000000005',
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
      quantity: asset.name === 'StableNFT' ? 1 : 1000,
      created_at: new Date().toISOString(),
    }));

    await db.insertInto('user_assets').values(userAssets).execute();

    // 4. Create asset daily prices (last 30 days, mixed trends)
    const today = new Date();
    const priceEntries = assets.flatMap((asset) =>
      Array.from({ length: 30 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        let price;
        switch (asset.name) {
          case 'GainCoin':
            price = 100 - i * 3; // Starts at 100, loses 3 per day
            break;
          case 'LossCoin':
            price = 100 + i * 2; // Starts at 100, gains 2 per day
            break;
          case 'StableNFT':
            price = 1000 + Math.sin(i) * 50; // Fluctuates around 1000
            break;
        }
        return {
          asset_id: asset.id,
          price,
          recorded_at: date.toISOString(),
        };
      }),
    );

    await db.insertInto('asset_daily_prices').values(priceEntries).execute();

    console.log('Seed data for mixed portfolio inserted successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await db.destroy();
  }
}

seedMixedPortfolio().catch(console.error);
