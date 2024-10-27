import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from './database.service';
import { getKyselyInstance } from './kysely.config';
import { Kysely } from 'kysely';
import { Database } from './types';

jest.mock('./kysely.config'); // Mock the Kysely config module

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockDb: Kysely<Database>;

  beforeEach(async () => {
    mockDb = {
      destroy: jest.fn(), // Mock the destroy method
    } as unknown as Kysely<Database>;

    (getKyselyInstance as jest.Mock).mockReturnValue(mockDb); // Mock the return value of getKyselyInstance

    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseService],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize the database connection', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await service.onModuleInit();
    expect(consoleSpy).toHaveBeenCalledWith('Database connection initialized.');
    consoleSpy.mockRestore();
  });

  it('should close the database connection on destroy', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await service.onModuleDestroy();
    expect(mockDb.destroy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Database connection closed.');
    consoleSpy.mockRestore();
  });

  it('should return the database instance', () => {
    const dbInstance = service.getDb();
    expect(dbInstance).toBe(mockDb);
  });
});
