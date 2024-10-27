import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validatePrivyToken: jest.fn(), // Mock the validatePrivyToken method
          },
        },
        JwtService, // Include JwtService if needed for AuthGuard
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should authenticate a user with a valid Privy token', async () => {
    const validToken = 'validPrivyToken';
    const mockAccessToken = 'mockAccessToken';

    // Mock the AuthService's validatePrivyToken method
    jest
      .spyOn(authService, 'validatePrivyToken')
      .mockResolvedValue({ accessToken: mockAccessToken });

    const result = await controller.authenticate(validToken);
    expect(result).toEqual({ accessToken: mockAccessToken });
  });

  it('should throw UnauthorizedException if no Privy token is provided', async () => {
    await expect(controller.authenticate(undefined)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException for an invalid Privy token', async () => {
    const invalidToken = 'invalidPrivyToken';
    jest
      .spyOn(authService, 'validatePrivyToken')
      .mockRejectedValue(new UnauthorizedException('Invalid Privy token'));

    await expect(controller.authenticate(invalidToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
