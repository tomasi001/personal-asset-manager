import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UserIdMiddleware } from './user_id.middleware';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

describe('UserIdMiddleware', () => {
  let middleware: UserIdMiddleware;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserIdMiddleware,
        ConfigService,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    middleware = module.get<UserIdMiddleware>(UserIdMiddleware);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should attach userId to request when valid token is provided', () => {
    const req = {
      headers: {
        authorization: 'Bearer validToken',
      },
    } as Request;
    const res = {} as Response;
    const next = jest.fn();

    jest.spyOn(jwtService, 'verify').mockReturnValue({ userId: 'testUserId' });

    middleware.use(req, res, next);

    expect(req['userId']).toBe('testUserId');
    expect(next).toHaveBeenCalled();
  });

  it('should not attach userId when no token is provided', () => {
    const req = {
      headers: {},
    } as Request;
    const res = {} as Response;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req['userId']).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('should not attach userId when token verification fails', () => {
    const req = {
      headers: {
        authorization: 'Bearer invalidToken',
      },
    } as Request;
    const res = {} as Response;
    const next = jest.fn();

    jest.spyOn(jwtService, 'verify').mockImplementation(() => {
      throw new Error('Invalid token');
    });

    middleware.use(req, res, next);

    expect(req['userId']).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('should handle malformed authorization header', () => {
    const req = {
      headers: {
        authorization: 'malformedHeader',
      },
    } as Request;
    const res = {} as Response;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req['userId']).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});
