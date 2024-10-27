import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseController } from './database.controller';
import { DatabaseService } from './database.service';
import { DatabaseModule } from './database.module';

describe('DatabaseController', () => {
  let controller: DatabaseController;
  let dbService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();

    controller = module.get<DatabaseController>(DatabaseController);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return a healthy database status', async () => {
    const result = await controller.getStatus();
    expect(result).toBe('Database connection is healthy!');
  });

  it('should return a failed database status', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Override the mock to simulate an error
    dbService.getDb = jest.fn().mockReturnValue({
      selectFrom: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      execute: jest
        .fn()
        .mockRejectedValue(new Error('Database connection error')), // Mock failure
    });

    const result = await controller.getStatus();
    expect(result).toBe('Database connection failed!');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
