import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthTokenClaims } from '@privy-io/server-auth';
import { DatabaseService } from '../database/database.service';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        UserService,
        DatabaseService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'PRIVY_APP_ID') return 'testAppId';
              if (key === 'PRIVY_APP_SECRET') return 'testAppSecret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Additional tests can be added here...

  it('should validate a valid Privy token and return a JWT', async () => {
    const validToken = 'validPrivyToken';
    const privyId = 'testPrivyId';
    const userId = 'testUserId';

    // Create a mock object that matches the AuthTokenClaims interface
    const claims: AuthTokenClaims = {
      appId: 'testAppId',
      issuer: 'testIssuer',
      issuedAt: Date.now(),
      expiration: Date.now() + 3600, // 1 hour later
      sessionId: 'testSessionId',
      userId: privyId,
    };

    const mockUser = {
      id: userId,
      privy_id: privyId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    jest.spyOn(service['privy'], 'verifyAuthToken').mockResolvedValue(claims);
    jest
      .spyOn(service['userService'], 'getOrCreateUser')
      .mockResolvedValue(mockUser);

    jest.spyOn(jwtService, 'sign').mockReturnValue('generatedJwt');

    const result = await service.validatePrivyToken(validToken);
    expect(result).toEqual({ accessToken: 'generatedJwt' });
    expect(service['userService'].getOrCreateUser).toHaveBeenCalledWith(
      privyId,
    );
    expect(jwtService.sign).toHaveBeenCalledWith(
      {
        userId: userId,
        sub: userId,
        privyId: privyId,
        iat: expect.any(Number),
      },
      {
        expiresIn: expect.any(String),
      },
    );
  });

  it('should throw UnauthorizedException for an invalid Privy token', async () => {
    const invalidToken = 'invalidToken';

    jest
      .spyOn(service['privy'], 'verifyAuthToken')
      .mockRejectedValue(new Error('Invalid token'));

    await expect(service.validatePrivyToken(invalidToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should rethrow ForbiddenException', async () => {
    const forbiddenToken = 'forbiddenToken';

    jest
      .spyOn(service['privy'], 'verifyAuthToken')
      .mockRejectedValue(new ForbiddenException('Forbidden'));

    await expect(service.validatePrivyToken(forbiddenToken)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should handle errors thrown by verifyAuthToken', async () => {
    const errorToken = 'errorToken';

    jest
      .spyOn(service['privy'], 'verifyAuthToken')
      .mockRejectedValue(new Error('Network error'));

    await expect(service.validatePrivyToken(errorToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
