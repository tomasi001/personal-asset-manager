/* eslint-disable @typescript-eslint/no-explicit-any */
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseController } from './database.controller';
import { DatabaseModule } from './database.module';
import { DatabaseService } from './database.service';

describe('DatabaseController', () => {
  let controller: DatabaseController;
  let dbService: DatabaseService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [JwtService],
    }).compile();

    controller = module.get<DatabaseController>(DatabaseController);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  (process.env.CI ? it.skip : it)(
    'should return a healthy database status',
    async () => {
      const result = await controller.getStatus();
      expect(result).toBe('Database connection is healthy!');
    },
  );

  it('should return a failed database status', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Override the mock to simulate an error
    // Override the mock to simulate an error
    jest.spyOn(dbService, 'getDb').mockReturnValue({
      selectFrom: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      execute: jest
        .fn()
        .mockRejectedValue(new Error('Database connection error')),
    } as any);

    const result = await controller.getStatus();
    expect(result).toBe('Database connection failed!');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
