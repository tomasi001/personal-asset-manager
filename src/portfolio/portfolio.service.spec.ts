import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioService } from './portfolio.service';
import { DatabaseService } from '../database/database.service';
import { AssetService } from '../assets/assets.service';
import { MergedUserAsset } from '../assets/interfaces/asset-interfaces';
import { AssetType } from '../assets/enums/ asset-type.enum';

describe('PortfolioService', () => {
  let portfolioService: PortfolioService;
  let databaseService: DatabaseService;
  let assetService: AssetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: DatabaseService,
          useValue: {
            getDb: jest.fn().mockReturnValue({
              selectFrom: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              executeTakeFirst: jest.fn(),
            }),
          },
        },
        {
          provide: AssetService,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    portfolioService = module.get<PortfolioService>(PortfolioService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    assetService = module.get<AssetService>(AssetService);
  });

  it('should calculate portfolio value and PnL correctly', async () => {
    const mockAssets: MergedUserAsset[] = [
      {
        id: '1',
        user_id: 'user1',
        asset_id: 'asset1',
        quantity: 10,
        name: 'Test Asset 1',
        asset_type: AssetType.ERC20,
        description: 'Test Description',
        contract_address: '0x123',
        chain: 'ethereum',
        token_id: null,
        created_at: new Date(),
        asset_created_at: new Date(),
      },
    ];

    const mockLatestPrice = { price: 100 };
    const mockInitialPrice = { price: 50 };

    jest.spyOn(assetService, 'findAll').mockResolvedValue(mockAssets);
    jest.spyOn(databaseService.getDb(), 'selectFrom').mockReturnValue({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      executeTakeFirst: jest
        .fn()
        .mockResolvedValueOnce(mockLatestPrice)
        .mockResolvedValueOnce(mockInitialPrice),
    } as any);

    const result = await portfolioService.getPortfolioValueAndPnL('user1');

    expect(result).toEqual({
      totalValue: 1000,
      pnl: 500,
      pnlPercentage: 100,
    });
  });

  it('should return default values when user has no assets', async () => {
    jest.spyOn(assetService, 'findAll').mockResolvedValue([]);

    const result = await portfolioService.getPortfolioValueAndPnL('user1');

    expect(result).toEqual({
      totalValue: 0,
      pnl: 0,
      pnlPercentage: 0,
    });
  });

  it('should handle multiple assets correctly', async () => {
    const mockAssets: MergedUserAsset[] = [
      {
        id: '1',
        user_id: 'user1',
        asset_id: 'asset1',
        quantity: 10,
        name: 'Test Asset 1',
        asset_type: AssetType.ERC20,
        description: 'Test Description',
        contract_address: '0x123',
        chain: 'ethereum',
        token_id: null,
        created_at: new Date(),
        asset_created_at: new Date(),
      },
      {
        id: '2',
        user_id: 'user1',
        asset_id: 'asset2',
        quantity: 5,
        name: 'Test Asset 2',
        asset_type: AssetType.ERC20,
        description: 'Test Description 2',
        contract_address: '0x456',
        chain: 'ethereum',
        token_id: null,
        created_at: new Date(),
        asset_created_at: new Date(),
      },
    ];

    jest.spyOn(assetService, 'findAll').mockResolvedValue(mockAssets);
    jest.spyOn(databaseService.getDb(), 'selectFrom').mockReturnValue({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      executeTakeFirst: jest
        .fn()
        .mockResolvedValueOnce({ price: 100 }) // Latest price for asset1
        .mockResolvedValueOnce({ price: 50 }) // Initial price for asset1
        .mockResolvedValueOnce({ price: 200 }) // Latest price for asset2
        .mockResolvedValueOnce({ price: 150 }), // Initial price for asset2
    } as any);

    const result = await portfolioService.getPortfolioValueAndPnL('user1');

    expect(result).toEqual({
      totalValue: 2000, // (10 * 100) + (5 * 200)
      pnl: 750, // (10 * (100 - 50)) + (5 * (200 - 150))
      pnlPercentage: 60, // (750 / (10 * 50 + 5 * 150)) * 100
    });
  });

  it('should handle missing price data correctly', async () => {
    const mockAssets: MergedUserAsset[] = [
      {
        id: '1',
        user_id: 'user1',
        asset_id: 'asset1',
        quantity: 10,
        name: 'Test Asset 1',
        asset_type: AssetType.ERC20,
        description: 'Test Description',
        contract_address: '0x123',
        chain: 'ethereum',
        token_id: null,
        created_at: new Date(),
        asset_created_at: new Date(),
      },
    ];

    jest.spyOn(assetService, 'findAll').mockResolvedValue(mockAssets);
    jest.spyOn(databaseService.getDb(), 'selectFrom').mockReturnValue({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      executeTakeFirst: jest.fn().mockResolvedValue(null), // Simulating missing price data
    } as any);

    const result = await portfolioService.getPortfolioValueAndPnL('user1');

    expect(result).toEqual({
      totalValue: 0,
      pnl: 0,
      pnlPercentage: 0,
    });
  });

  it('should handle errors and log them correctly', async () => {
    const mockError = new Error('Test error');
    jest.spyOn(assetService, 'findAll').mockRejectedValue(mockError);

    const loggerSpy = jest.spyOn(portfolioService['logger'], 'error');

    await expect(
      portfolioService.getPortfolioValueAndPnL('user1'),
    ).rejects.toThrow('Test error');

    expect(loggerSpy).toHaveBeenCalledWith(
      'Error calculating portfolio value: Test error',
      expect.any(String),
    );
  });
});
