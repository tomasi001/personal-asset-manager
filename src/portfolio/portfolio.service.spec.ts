import { Test, TestingModule } from '@nestjs/testing';
import { AssetService } from '../assets/assets.service';
import { DatabaseService } from '../database/database.service';
import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  let portfolioService: PortfolioService;
  let assetService: AssetService;
  // let databaseService: DatabaseService;

  const mockDb = {
    selectFrom: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    executeTakeFirst: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: DatabaseService,
          useValue: { getDb: jest.fn().mockReturnValue(mockDb) },
        },
        {
          provide: AssetService,
          useValue: { findAll: jest.fn() },
        },
      ],
    }).compile();

    portfolioService = module.get<PortfolioService>(PortfolioService);
    assetService = module.get<AssetService>(AssetService);
    // databaseService = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(portfolioService).toBeDefined();
  });

  describe('getPortfolioValueAndPnL', () => {
    it('should return default values when user has no assets', async () => {
      jest.spyOn(assetService, 'findAll').mockResolvedValue([]);

      const result = await portfolioService.getPortfolioValueAndPnL('user123');

      expect(result).toEqual({
        totalValue: 0,
        pnl: 0,
        pnlPercentage: 0,
      });
    });

    it('should calculate portfolio value and PnL correctly', async () => {
      const mockAssets = [
        {
          userAssetId: 'userAsset1',
          assetId: 'asset1',
          name: 'Asset 1',
          asset_type: 'ERC-20' as const,
          description: 'Description for Asset 1',
          contract_address: '0x1234567890123456789012345678901234567890',
          chain: 'Ethereum',
          token_id: '',
          created_at: new Date(),
          quantity: 10,
        },
        {
          userAssetId: 'userAsset2',
          assetId: 'asset2',
          name: 'Asset 2',
          asset_type: 'ERC-721' as const,
          description: 'Description for Asset 2',
          contract_address: '0x0987654321098765432109876543210987654321',
          chain: 'Polygon',
          token_id: '1234',
          created_at: new Date(),
          quantity: 5,
        },
      ];

      jest.spyOn(assetService, 'findAll').mockResolvedValue(mockAssets);

      mockDb.executeTakeFirst
        .mockResolvedValueOnce({ price: 100 }) // Latest price for asset1
        .mockResolvedValueOnce({ price: 80 }) // Initial price for asset1
        .mockResolvedValueOnce({ price: 50 }) // Latest price for asset2
        .mockResolvedValueOnce({ price: 40 }); // Initial price for asset2

      const result = await portfolioService.getPortfolioValueAndPnL('user123');

      expect(result).toEqual({
        totalValue: 1250,
        pnl: 250,
        pnlPercentage: 25,
      });
    });

    it('should handle assets with missing price data', async () => {
      const mockAssets = [
        {
          userAssetId: 'userAsset1',
          assetId: 'asset1',
          name: 'Asset 1',
          asset_type: 'ERC-20' as const,
          description: 'Description for Asset 1',
          contract_address: '0x1234567890123456789012345678901234567890',
          chain: 'Ethereum',
          token_id: '',
          created_at: new Date(),
          quantity: 10,
        },
        {
          userAssetId: 'userAsset2',
          assetId: 'asset2',
          name: 'Asset 2',
          asset_type: 'ERC-721' as const,
          description: 'Description for Asset 2',
          contract_address: '0x0987654321098765432109876543210987654321',
          chain: 'Polygon',
          token_id: '1234',
          created_at: new Date(),
          quantity: 5,
        },
      ];

      jest.spyOn(assetService, 'findAll').mockResolvedValue(mockAssets);

      mockDb.executeTakeFirst
        .mockResolvedValueOnce({ price: 100 }) // Latest price for asset1
        .mockResolvedValueOnce({ price: 80 }) // Initial price for asset1
        .mockResolvedValueOnce(null) // Missing latest price for asset2
        .mockResolvedValueOnce({ price: 40 }); // Initial price for asset2

      const result = await portfolioService.getPortfolioValueAndPnL('user123');

      expect(result).toEqual({
        totalValue: 1000,
        pnl: 200,
        pnlPercentage: 25,
      });
    });
  });
});
