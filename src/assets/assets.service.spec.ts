import { Test, TestingModule } from '@nestjs/testing';
import { AssetService } from './assets.service';
import { DatabaseService } from '../database/database.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { AssetType } from './enums/ asset-type.enum';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { MergedUserAsset } from './interfaces/asset-interfaces';

describe('AssetService', () => {
  let service: AssetService;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetService,
        {
          provide: DatabaseService,
          useValue: {
            getDb: jest.fn().mockReturnValue({
              transaction: jest.fn().mockReturnValue({
                execute: jest.fn(),
              }),
              insertInto: jest.fn().mockReturnValue({
                values: jest.fn().mockReturnThis(),
                execute: jest.fn(),
              }),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AssetService>(AssetService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new asset and add it to user portfolio', async () => {
      const createAssetDto: CreateAssetDto = {
        name: 'Test Asset',
        asset_type: AssetType.ERC20,
        description: 'Test Description',
        contract_address: '0x1234567890123456789012345678901234567890',
        chain: 'ethereum',
        quantity: 100,
      };
      const userId = 'user123';

      const mockExecute = jest.fn().mockResolvedValue({
        id: 'asset123',
        name: createAssetDto.name,
        asset_type: createAssetDto.asset_type,
        description: createAssetDto.description,
        contract_address: createAssetDto.contract_address,
        chain: createAssetDto.chain,
        created_at: new Date(),
      });

      jest
        .spyOn(databaseService.getDb().transaction(), 'execute')
        .mockImplementation(mockExecute);

      const result = await service.create(createAssetDto, userId);

      expect(result).toEqual({
        message: 'Asset added to user portfolio successfully',
        assetId: 'asset123',
      });
      expect(mockExecute).toHaveBeenCalled();
      expect(databaseService.getDb().insertInto).toHaveBeenCalledWith(
        'user_assets',
      );
    });

    it('should throw HttpException if token_id is provided for ERC20 asset', async () => {
      const createAssetDto: CreateAssetDto = {
        name: 'Test Asset',
        asset_type: AssetType.ERC20,
        description: 'Test Description',
        contract_address: '0x1234567890123456789012345678901234567890',
        chain: 'ethereum',
        quantity: 100,
        token_id: '1', // This should cause an error for ERC20
      };
      const userId = 'user123';

      await expect(service.create(createAssetDto, userId)).rejects.toThrow(
        new HttpException(
          'Token ID should not be provided for ERC-20 assets',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw HttpException if quantity is provided for ERC721 asset', async () => {
      const createAssetDto: CreateAssetDto = {
        name: 'Test NFT',
        asset_type: AssetType.ERC721,
        description: 'Test NFT Description',
        contract_address: '0x1234567890123456789012345678901234567890',
        chain: 'ethereum',
        token_id: '1',
        quantity: 1, // This should cause an error for ERC721
      };
      const userId = 'user123';

      await expect(service.create(createAssetDto, userId)).rejects.toThrow(
        new HttpException(
          'Quantity should not be provided for ERC-721 assets',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw HttpException if quantity is not provided for ERC20 asset', async () => {
      const createAssetDto: CreateAssetDto = {
        name: 'Test Token',
        asset_type: AssetType.ERC20,
        description: 'Test Token Description',
        contract_address: '0x1234567890123456789012345678901234567890',
        chain: 'ethereum',
        // quantity is missing
      };
      const userId = 'user123';

      await expect(service.create(createAssetDto, userId)).rejects.toThrow(
        new HttpException(
          'A positive quantity must be provided for ERC-20 assets',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw HttpException if quantity is zero or negative for ERC20 asset', async () => {
      const createAssetDto: CreateAssetDto = {
        name: 'Test Token',
        asset_type: AssetType.ERC20,
        description: 'Test Token Description',
        contract_address: '0x1234567890123456789012345678901234567890',
        chain: 'ethereum',
        quantity: 0, // This should cause an error for ERC20
      };
      const userId = 'user123';

      await expect(service.create(createAssetDto, userId)).rejects.toThrow(
        new HttpException(
          'A positive quantity must be provided for ERC-20 assets',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw HttpException if token_id is missing for ERC721 asset', async () => {
      const createAssetDto: CreateAssetDto = {
        name: 'Test NFT',
        asset_type: AssetType.ERC721,
        description: 'Test NFT Description',
        contract_address: '0x1234567890123456789012345678901234567890',
        chain: 'ethereum',
        // token_id is missing
      };
      const userId = 'user123';

      await expect(service.create(createAssetDto, userId)).rejects.toThrow(
        new HttpException(
          'Token ID is required for ERC-721 assets',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('findAll', () => {
    it('should return all assets for a given user', async () => {
      const userId = 'user123';
      const mockAssets: MergedUserAsset[] = [
        {
          id: 'userAsset1',
          user_id: userId,
          asset_id: 'asset1',
          quantity: 100,
          created_at: new Date(),
          name: 'Test Asset 1',
          asset_type: AssetType.ERC20,
          description: 'Test Description 1',
          contract_address: '0x1234567890123456789012345678901234567890',
          chain: 'ethereum',
          token_id: null,
          asset_created_at: new Date(),
        },
        {
          id: 'userAsset2',
          user_id: userId,
          asset_id: 'asset2',
          quantity: null,
          created_at: new Date(),
          name: 'Test Asset 2',
          asset_type: AssetType.ERC721,
          description: 'Test Description 2',
          contract_address: '0x0987654321098765432109876543210987654321',
          chain: 'ethereum',
          token_id: '1',
          asset_created_at: new Date(),
        },
      ];

      const mockSelectFrom = jest.fn().mockReturnThis();
      const mockInnerJoin = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockExecute = jest.fn().mockResolvedValue(mockAssets);

      jest.spyOn(databaseService, 'getDb').mockReturnValue({
        selectFrom: mockSelectFrom,
        innerJoin: mockInnerJoin,
        where: mockWhere,
        select: mockSelect,
        execute: mockExecute,
      } as any);

      const result = await service.findAll(userId);

      expect(result).toEqual(mockAssets);
      expect(mockSelectFrom).toHaveBeenCalledWith('user_assets');
      expect(mockInnerJoin).toHaveBeenCalledWith(
        'assets',
        'assets.id',
        'user_assets.asset_id',
      );
      expect(mockWhere).toHaveBeenCalledWith(
        'user_assets.user_id',
        '=',
        userId,
      );
      expect(mockSelect).toHaveBeenCalledWith([
        'user_assets.id',
        'user_assets.user_id',
        'user_assets.asset_id',
        'user_assets.quantity',
        'user_assets.created_at',
        'assets.name',
        'assets.asset_type',
        'assets.description',
        'assets.contract_address',
        'assets.chain',
        'assets.token_id',
        'assets.created_at as asset_created_at',
      ]);
      expect(mockExecute).toHaveBeenCalled();
    });

    it('should return an empty array if user has no assets', async () => {
      const userId = 'userWithNoAssets';

      jest.spyOn(databaseService, 'getDb').mockReturnValue({
        selectFrom: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a specific asset for a given user', async () => {
      const userAssetId = 'userAsset1';
      const userId = 'user123';
      const mockAsset: MergedUserAsset = {
        id: userAssetId,
        user_id: userId,
        asset_id: 'asset1',
        quantity: 100,
        created_at: new Date(),
        name: 'Test Asset 1',
        asset_type: AssetType.ERC20,
        description: 'Test Description 1',
        contract_address: '0x1234567890123456789012345678901234567890',
        chain: 'ethereum',
        token_id: null,
        asset_created_at: new Date(),
      };

      const mockSelectFrom = jest.fn().mockReturnThis();
      const mockInnerJoin = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockExecuteTakeFirst = jest.fn().mockResolvedValue(mockAsset);

      jest.spyOn(databaseService, 'getDb').mockReturnValue({
        selectFrom: mockSelectFrom,
        innerJoin: mockInnerJoin,
        where: mockWhere,
        select: mockSelect,
        executeTakeFirst: mockExecuteTakeFirst,
      } as any);

      const result = await service.findOne(userAssetId, userId);

      expect(result).toEqual(mockAsset);
      expect(mockSelectFrom).toHaveBeenCalledWith('user_assets');
      expect(mockInnerJoin).toHaveBeenCalledWith(
        'assets',
        'assets.id',
        'user_assets.asset_id',
      );
      expect(mockWhere).toHaveBeenCalledWith(
        'user_assets.id',
        '=',
        userAssetId,
      );
      expect(mockWhere).toHaveBeenCalledWith(
        'user_assets.user_id',
        '=',
        userId,
      );
      expect(mockSelect).toHaveBeenCalledWith([
        'user_assets.id',
        'user_assets.user_id',
        'user_assets.asset_id',
        'user_assets.quantity',
        'user_assets.created_at',
        'assets.name',
        'assets.asset_type',
        'assets.description',
        'assets.contract_address',
        'assets.chain',
        'assets.token_id',
        'assets.created_at as asset_created_at',
      ]);
      expect(mockExecuteTakeFirst).toHaveBeenCalled();
    });

    it('should throw NotFoundException if asset is not found', async () => {
      const userAssetId = 'nonExistentAsset';
      const userId = 'user123';

      jest.spyOn(databaseService, 'getDb').mockReturnValue({
        selectFrom: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.findOne(userAssetId, userId)).rejects.toThrow(
        new NotFoundException(
          `Asset with ID ${userAssetId} not found in user's portfolio`,
        ),
      );
    });
  });

  describe('remove', () => {
    it('should remove a specific asset from user portfolio', async () => {
      const userAssetId = 'userAsset1';
      const userId = 'user123';

      const mockDeleteFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockExecuteTakeFirst = jest
        .fn()
        .mockResolvedValue({ numDeletedRows: 1n });

      jest.spyOn(databaseService, 'getDb').mockReturnValue({
        deleteFrom: mockDeleteFrom,
        where: mockWhere,
        executeTakeFirst: mockExecuteTakeFirst,
      } as any);

      const result = await service.remove(userAssetId, userId);

      expect(result).toEqual({
        message: 'Asset removed from user portfolio successfully',
      });
      expect(mockDeleteFrom).toHaveBeenCalledWith('user_assets');
      expect(mockWhere).toHaveBeenCalledWith('id', '=', userAssetId);
      expect(mockWhere).toHaveBeenCalledWith('user_id', '=', userId);
      expect(mockExecuteTakeFirst).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user-asset entry is not found', async () => {
      const userAssetId = 'nonExistentAsset';
      const userId = 'user123';

      jest.spyOn(databaseService, 'getDb').mockReturnValue({
        deleteFrom: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: 0n }),
      } as any);

      await expect(service.remove(userAssetId, userId)).rejects.toThrow(
        new NotFoundException('User-asset entry not found in the portfolio'),
      );
    });

    it('should throw NotFoundException if delete operation returns null', async () => {
      const userAssetId = 'userAsset1';
      const userId = 'user123';

      jest.spyOn(databaseService, 'getDb').mockReturnValue({
        deleteFrom: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.remove(userAssetId, userId)).rejects.toThrow(
        new NotFoundException('User-asset entry not found in the portfolio'),
      );
    });

    it('should throw BadRequestException if delete operation fails', async () => {
      const userAssetId = 'userAsset1';
      const userId = 'user123';

      jest.spyOn(databaseService, 'getDb').mockReturnValue({
        deleteFrom: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest
          .fn()
          .mockRejectedValue(new Error('Database error')),
      } as any);

      await expect(service.remove(userAssetId, userId)).rejects.toThrow(
        new BadRequestException('Failed to remove asset from user portfolio'),
      );
    });

    it("should throw BadRequestException if there's a database constraint violation", async () => {
      const userAssetId = 'userAsset1';
      const userId = 'user123';

      jest.spyOn(databaseService, 'getDb').mockReturnValue({
        deleteFrom: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest
          .fn()
          .mockRejectedValue(new Error('foreign key constraint violation')),
      } as any);

      await expect(service.remove(userAssetId, userId)).rejects.toThrow(
        new BadRequestException('Failed to remove asset from user portfolio'),
      );
    });
  });

  describe('getAssetHistory', () => {
    const userAssetId = 'userAsset1';
    const userId = 'user123';
    const mockUserAsset: MergedUserAsset = {
      id: userAssetId,
      user_id: userId,
      asset_id: 'asset1',
      quantity: 100,
      created_at: new Date(),
      name: 'Test Asset',
      asset_type: AssetType.ERC20,
      description: 'Test Description',
      contract_address: '0x1234567890123456789012345678901234567890',
      chain: 'ethereum',
      token_id: null,
      asset_created_at: new Date(),
    };

    beforeEach(() => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUserAsset);
      jest
        .spyOn(service as any, 'validateUserAsset')
        .mockImplementation(() => {});
    });

    it('should return asset history with metrics', async () => {
      const mockPriceHistory = [
        { price: 100, recorded_at: new Date('2023-01-01') },
        { price: 110, recorded_at: new Date('2023-01-02') },
        { price: 105, recorded_at: new Date('2023-01-03') },
      ];

      jest
        .spyOn(service as any, 'fetchPriceHistory')
        .mockResolvedValue(mockPriceHistory);
      jest.spyOn(service as any, 'calculateHistoryMetrics').mockReturnValue([
        {
          date: '2023-01-01',
          price: '100.000000',
          value: 10000,
          dailyPnl: 0,
          cumulativePnl: 0,
          cumulativePnlPercentage: 0,
        },
        {
          date: '2023-01-02',
          price: '110.000000',
          value: 11000,
          dailyPnl: 1000,
          cumulativePnl: 1000,
          cumulativePnlPercentage: 10,
        },
        {
          date: '2023-01-03',
          price: '105.000000',
          value: 10500,
          dailyPnl: -500,
          cumulativePnl: 500,
          cumulativePnlPercentage: 5,
        },
      ]);
      jest.spyOn(service as any, 'calculateOverallMetrics').mockReturnValue({
        overallPnl: 500,
        overallPnlPercentage: 5,
      });
      jest
        .spyOn(service as any, 'formatQuantity')
        .mockReturnValue('100.000000');

      const result = await service.getAssetHistory(userAssetId, userId);

      expect(result).toEqual({
        history: [
          {
            date: '2023-01-01',
            price: '100.000000',
            value: 10000,
            dailyPnl: 0,
            cumulativePnl: 0,
            cumulativePnlPercentage: 0,
          },
          {
            date: '2023-01-02',
            price: '110.000000',
            value: 11000,
            dailyPnl: 1000,
            cumulativePnl: 1000,
            cumulativePnlPercentage: 10,
          },
          {
            date: '2023-01-03',
            price: '105.000000',
            value: 10500,
            dailyPnl: -500,
            cumulativePnl: 500,
            cumulativePnlPercentage: 5,
          },
        ],
        quantity: '100.000000',
        overallPnl: 500,
        overallPnlPercentage: 5,
      });
    });

    it('should return empty asset history when no price history is available', async () => {
      jest.spyOn(service as any, 'fetchPriceHistory').mockResolvedValue([]);
      jest.spyOn(service as any, 'createEmptyAssetHistory').mockReturnValue({
        history: [],
        quantity: '100.000000',
        overallPnl: 0,
        overallPnlPercentage: 0,
      });

      const result = await service.getAssetHistory(userAssetId, userId);

      expect(result).toEqual({
        history: [],
        quantity: '100.000000',
        overallPnl: 0,
        overallPnlPercentage: 0,
      });
    });

    it('should throw NotFoundException when user asset is not found', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new NotFoundException('User asset not found'));

      await expect(
        service.getAssetHistory(userAssetId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use provided start and end dates when fetching price history', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const mockFetchPriceHistory = jest
        .spyOn(service as any, 'fetchPriceHistory')
        .mockResolvedValue([]);

      await service.getAssetHistory(userAssetId, userId, startDate, endDate);

      expect(mockFetchPriceHistory).toHaveBeenCalledWith(
        mockUserAsset.asset_id,
        startDate,
        endDate,
      );
    });
  });
});
