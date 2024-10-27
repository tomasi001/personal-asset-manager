import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { JwtService } from '@nestjs/jwt';

describe('PortfolioController', () => {
  let controller: PortfolioController;
  let portfolioService: PortfolioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        JwtService,
        {
          provide: PortfolioService,
          useValue: {
            getPortfolioValueAndPnL: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PortfolioController>(PortfolioController);
    portfolioService = module.get<PortfolioService>(PortfolioService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPortfolioValueAndPnL', () => {
    it('should return portfolio value and PnL', async () => {
      const mockResult = {
        totalValue: 1000,
        pnl: 200,
        pnlPercentage: 20,
      };
      jest
        .spyOn(portfolioService, 'getPortfolioValueAndPnL')
        .mockResolvedValue(mockResult);

      const userId = 'testUser123';
      const result = await controller.getPortfolioValueAndPnL(userId);

      expect(result).toEqual(mockResult);
      expect(portfolioService.getPortfolioValueAndPnL).toHaveBeenCalledWith(
        userId,
      );
    });

    it('should handle errors from the service', async () => {
      const errorMessage = 'An error occurred';
      jest
        .spyOn(portfolioService, 'getPortfolioValueAndPnL')
        .mockRejectedValue(new Error(errorMessage));

      const userId = 'testUser123';
      await expect(controller.getPortfolioValueAndPnL(userId)).rejects.toThrow(
        errorMessage,
      );
    });
  });
});
