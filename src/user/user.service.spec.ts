import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { DatabaseService } from '../database/database.service';
import { NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;

  const mockDb = {
    selectFrom: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    executeTakeFirst: jest.fn(),
    insertInto: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: DatabaseService,
          useValue: { getDb: jest.fn().mockReturnValue(mockDb) },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateUser', () => {
    it('should return existing user if found', async () => {
      const mockUser = { id: '1', privy_id: 'existingPrivyId' };
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockUser);

      const result = await service.getOrCreateUser('existingPrivyId');

      expect(result).toEqual(mockUser);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
      expect(mockDb.where).toHaveBeenCalledWith(
        'privy_id',
        '=',
        'existingPrivyId',
      );
    });

    it('should create and return new user if not found', async () => {
      const mockNewUser = {
        id: '2',
        privy_id: 'newPrivyId',
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockDb.executeTakeFirst.mockResolvedValueOnce(null);
      mockDb.execute.mockResolvedValueOnce([mockNewUser]);

      const result = await service.getOrCreateUser('newPrivyId');

      expect(result).toEqual(mockNewUser);
      expect(mockDb.insertInto).toHaveBeenCalledWith('users');
      expect(mockDb.values).toHaveBeenCalledWith({ privy_id: 'newPrivyId' });
    });
  });

  describe('findOne', () => {
    it('should return user if found', async () => {
      const mockUser = { id: '1', privy_id: 'somePrivyId' };
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockUser);

      const result = await service.findOne('1');

      expect(result).toEqual(mockUser);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
      expect(mockDb.where).toHaveBeenCalledWith('id', '=', '1');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
