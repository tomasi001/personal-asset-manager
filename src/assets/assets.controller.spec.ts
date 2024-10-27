import { Test, TestingModule } from '@nestjs/testing';
import { AssetController } from './assets.controller';
import { AssetService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { JwtService } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';

describe('AssetController', () => {
  let controller: AssetController;
  let assetService: AssetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ScheduleModule.forRoot()],
      controllers: [AssetController],
      providers: [
        JwtService,
        {
          provide: AssetService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            getAssetHistory: jest.fn(),
            updateAssetPrices: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AssetController>(AssetController);
    assetService = module.get<AssetService>(AssetService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an asset', async () => {
      const createAssetDto: CreateAssetDto = {
        name: 'name',
        asset_type: 'ERC-20',
        description: 'description',
        contract_address: 'contract_address',
        chain: 'Ethereum',
      };

      const userId = 'user123';
      const expectedResult = {
        message: 'Asset added successfully',
        assetId: '61d9baf5-cdab-476e-a4ee-90c0da63c5a2',
      };

      jest.spyOn(assetService, 'create').mockResolvedValue(expectedResult);

      const result = await controller.create(createAssetDto, userId);
      expect(result).toBe(expectedResult);
      expect(assetService.create).toHaveBeenCalledWith(createAssetDto, userId);
    });
  });

  describe('findAll', () => {
    it('should return all assets for a user', async () => {
      const userId = 'user123';
      const expectedResult = [
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
          quantity: 100,
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
          quantity: 1,
        },
      ];

      jest.spyOn(assetService, 'findAll').mockResolvedValue(expectedResult);

      const result = await controller.findAll(userId);
      expect(result).toBe(expectedResult);
      expect(assetService.findAll).toHaveBeenCalledWith(userId);
    });
  });

  describe('findOne', () => {
    it('should return a single asset', async () => {
      const assetId = 'asset1';
      const userId = 'user123';
      const expectedResult = {
        userAssetId: 'userAsset1',
        assetId: 'asset1',
        name: 'Asset 1',
        asset_type: 'ERC-20' as const,
        description: 'Description for Asset 1',
        contract_address: '0x1234567890123456789012345678901234567890',
        chain: 'Ethereum',
        token_id: '',
        created_at: new Date(),
        quantity: 100,
      };

      jest.spyOn(assetService, 'findOne').mockResolvedValue(expectedResult);

      const result = await controller.findOne(assetId, userId);
      expect(result).toBe(expectedResult);
      expect(assetService.findOne).toHaveBeenCalledWith(assetId, userId);
    });
  });

  describe('remove', () => {
    it('should remove an asset', async () => {
      const assetId = 'asset1';
      const userId = 'user123';
      const expectedResult = { message: 'Asset removed successfully' };

      jest.spyOn(assetService, 'remove').mockResolvedValue(expectedResult);

      const result = await controller.remove(assetId, userId);
      expect(result).toBe(expectedResult);
      expect(assetService.remove).toHaveBeenCalledWith(assetId, userId);
    });
  });

  describe('getAssetHistory', () => {
    it('should return asset history', async () => {
      const assetId = 'asset1';
      const userId = 'user123';
      const startDate = '2023-01-01';
      const endDate = '2023-12-31';
      const expectedResult = {
        history: [
          {
            date: new Date('2023-01-01'),
            price: 100,
            value: 1000,
            dailyPnl: 0,
            cumulativePnl: 0,
            cumulativePnlPercentage: 0,
          },
          {
            date: new Date('2023-12-31'),
            price: 150,
            value: 1500,
            dailyPnl: 500,
            cumulativePnl: 500,
            cumulativePnlPercentage: 50,
          },
        ],
        quantity: 10,
        overallPnl: 500,
        overallPnlPercentage: 50,
      };

      jest
        .spyOn(assetService, 'getAssetHistory')
        .mockResolvedValue(expectedResult);

      const result = await controller.getAssetHistory(
        assetId,
        userId,
        startDate,
        endDate,
      );
      expect(result).toBe(expectedResult);
      expect(assetService.getAssetHistory).toHaveBeenCalledWith(
        assetId,
        userId,
        new Date(startDate),
        new Date(endDate),
      );
    });
  });

  describe('manualUpdatePrices', () => {
    it('should update asset prices manually', async () => {
      const expectedResult = { message: 'Asset prices updated successfully' };
      jest
        .spyOn(assetService, 'updateAssetPrices')
        .mockResolvedValue(expectedResult);

      const result = await controller.manualUpdatePrices();
      expect(result).toEqual(expectedResult);
      expect(assetService.updateAssetPrices).toHaveBeenCalled();
    });
  });

  describe('handleDailyPriceUpdate', () => {
    it('should update asset prices automatically', async () => {
      const expectedResult = { message: 'Asset prices updated successfully' };
      jest
        .spyOn(assetService, 'updateAssetPrices')
        .mockResolvedValue(expectedResult);

      await controller.handleDailyPriceUpdate();
      expect(assetService.updateAssetPrices).toHaveBeenCalled();
    });
  });
});
