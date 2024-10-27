import { Test, TestingModule } from '@nestjs/testing';
import { AssetService } from './assets.service';
import { DatabaseService } from '../database/database.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { HttpException, NotFoundException } from '@nestjs/common';

describe('AssetService', () => {
  let service: AssetService;
  // let databaseService: DatabaseService;

  const mockDb = {
    selectFrom: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    executeTakeFirst: jest.fn(),
    insertInto: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetService,
        {
          provide: DatabaseService,
          useValue: { getDb: jest.fn().mockReturnValue(mockDb) },
        },
      ],
    }).compile();

    service = module.get<AssetService>(AssetService);
    // databaseService = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new asset and add it to user portfolio', async () => {
      const createAssetDto: CreateAssetDto = {
        name: 'Test Asset',
        asset_type: 'ERC-20',
        contract_address: '0x1234567890123456789012345678901234567890',
        chain: 'Ethereum',
        quantity: 100,
      };
      const userId = 'user123';

      // Mock the asset check
      mockDb.executeTakeFirst.mockResolvedValueOnce(null);

      // Mock the asset creation
      mockDb.execute.mockResolvedValueOnce([{ id: 'asset1' }]);

      // Mock the user asset creation
      mockDb.execute.mockResolvedValueOnce([{ id: 'userAsset1' }]);

      const result = await service.create(createAssetDto, userId);

      expect(result).toEqual({
        message: 'Asset added to user portfolio successfully',
        assetId: 'asset1',
      });

      // Verify that the database methods were called correctly
      expect(mockDb.selectFrom).toHaveBeenCalledWith('assets');
      expect(mockDb.where).toHaveBeenCalledWith(
        'contract_address',
        '=',
        createAssetDto.contract_address,
      );
      expect(mockDb.where).toHaveBeenCalledWith(
        'chain',
        '=',
        createAssetDto.chain,
      );
      expect(mockDb.where).toHaveBeenCalledWith(
        'asset_type',
        '=',
        createAssetDto.asset_type,
      );
      expect(mockDb.selectAll).toHaveBeenCalled();
      expect(mockDb.executeTakeFirst).toHaveBeenCalled();

      expect(mockDb.insertInto).toHaveBeenCalledWith('assets');
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createAssetDto.name,
          asset_type: createAssetDto.asset_type,
          contract_address: createAssetDto.contract_address,
          chain: createAssetDto.chain,
        }),
      );

      expect(mockDb.insertInto).toHaveBeenCalledWith('user_assets');
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          asset_id: 'asset1',
          quantity: createAssetDto.quantity,
        }),
      );
    });

    it('should throw HttpException if an error occurs', async () => {
      const createAssetDto: CreateAssetDto = {
        name: 'Test Asset',
        asset_type: 'ERC-20',
        contract_address: '0x1234567890123456789012345678901234567890',
        chain: 'Ethereum',
        quantity: 100,
      };
      const userId = 'user123';

      // Mock an error
      mockDb.executeTakeFirst.mockRejectedValueOnce(
        new Error('Database error'),
      );

      await expect(service.create(createAssetDto, userId)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all assets for a user', async () => {
      const userId = 'user123';
      const mockAssets = [
        { userAssetId: 'ua1', assetId: 'a1', name: 'Asset 1' },
        { userAssetId: 'ua2', assetId: 'a2', name: 'Asset 2' },
      ];

      mockDb.execute.mockResolvedValueOnce(mockAssets);

      const result = await service.findAll(userId);

      expect(result).toEqual(mockAssets);
    });
  });

  describe('findOne', () => {
    it('should return a specific asset for a user', async () => {
      const userAssetId = 'ua1';
      const userId = 'user123';
      const mockAsset = { userAssetId: 'ua1', assetId: 'a1', name: 'Asset 1' };

      mockDb.executeTakeFirst.mockResolvedValueOnce(mockAsset);

      const result = await service.findOne(userAssetId, userId);

      expect(result).toEqual(mockAsset);
    });

    it('should throw NotFoundException if asset is not found', async () => {
      const userAssetId = 'ua1';
      const userId = 'user123';

      mockDb.executeTakeFirst.mockResolvedValueOnce(null);

      await expect(service.findOne(userAssetId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAssetHistory', () => {
    it('should return asset history and performance metrics', async () => {
      const userAssetId = 'ua1';
      const userId = 'user123';
      const mockUserAsset = {
        assetId: 'a1',
        asset_type: 'ERC-20',
        quantity: 100,
      };
      const mockPriceHistory = [
        { price: 100, recorded_at: new Date('2023-01-01') },
        { price: 110, recorded_at: new Date('2023-01-02') },
      ];

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockUserAsset as any);
      mockDb.execute.mockResolvedValueOnce(mockPriceHistory);

      const result = await service.getAssetHistory(userAssetId, userId);

      expect(result).toHaveProperty('history');
      expect(result).toHaveProperty('quantity', 100);
      expect(result).toHaveProperty('overallPnl');
      expect(result).toHaveProperty('overallPnlPercentage');
    });
  });

  describe('updateAssetPrices', () => {
    it('should update prices for all assets', async () => {
      const mockAssets = [{ id: 'a1', asset_type: 'ERC-20' }];
      const mockLatestPrice = { price: 100 };

      mockDb.execute.mockResolvedValueOnce(mockAssets);
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockLatestPrice);
      mockDb.execute.mockResolvedValueOnce([{ id: 'price1' }]);

      const result = await service.updateAssetPrices();

      expect(result).toEqual({ message: 'Asset prices updated successfully' });
    });
  });
});
