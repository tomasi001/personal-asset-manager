import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthTokenClaims } from '@privy-io/server-auth';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
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
    const validToken =
      'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InBMYnFOODM3aXVMdGlBalNFWkhlN3JPUkxZRS1kMDcwY0lIeDl6bUx4dzAifQ.eyJzaWQiOiJjbTJxMzNubm0wMGpsMTN0cDI3eGY5cm81IiwiaXNzIjoicHJpdnkuaW8iLCJpYXQiOjE3Mjk5NDI1MDQsImF1ZCI6ImNtMnEwNDdzZzBnNnExMGpzcnhhZzBncXMiLCJzdWIiOiJkaWQ6cHJpdnk6Y20ycTEwMXF1MDI0NWJkZDhvaTc2cmFzdCIsImV4cCI6MTcyOTk0NjEwNH0.FROEm_O5C_KLQz6L0ZHCHMSY_AvttphI6_0V1nr6qTLc5YxXWPrCPFu02pDshJNWL91pE21OBv4eaMhd9dlzdg';

    // Create a mock object that matches the AuthTokenClaims interface
    const claims: AuthTokenClaims = {
      appId: 'testAppId',
      issuer: 'testIssuer',
      issuedAt: Date.now(),
      expiration: Date.now() + 3600, // 1 hour later
      sessionId: 'testSessionId',
      userId: 'testUserId',
    };

    jest.spyOn(service['privy'], 'verifyAuthToken').mockResolvedValue(claims);
    jest.spyOn(jwtService, 'sign').mockReturnValue('generatedJwt');

    const result = await service.validatePrivyToken(validToken);
    expect(result).toEqual({ accessToken: 'generatedJwt' });
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
