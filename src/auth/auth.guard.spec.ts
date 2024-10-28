import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { ConfigService } from '@nestjs/config';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test_secret'),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(), // Change this line
          },
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockExecutionContext: jest.Mocked<ExecutionContext>;

    beforeEach(() => {
      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
          }),
        }),
      } as unknown as jest.Mocked<ExecutionContext>;
    });

    it('should throw UnauthorizedException if no token is provided', async () => {
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return true for a valid token', async () => {
      const mockRequest = {
        headers: { authorization: 'Bearer validtoken' },
        user: {},
      };
      (
        mockExecutionContext.switchToHttp().getRequest as jest.Mock
      ).mockReturnValue(mockRequest);
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        // Change this line
        userId: '123',
      });

      await expect(guard.canActivate(mockExecutionContext)).resolves.toBe(true);
      expect(mockRequest.user).toEqual({ userId: '123' });
    });

    it('should throw UnauthorizedException for an invalid token', async () => {
      const mockRequest = {
        headers: { authorization: 'Bearer invalidtoken' },
      };
      (
        mockExecutionContext.switchToHttp().getRequest as jest.Mock
      ).mockReturnValue(mockRequest);
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
        // Change this line
        new Error('Invalid token'),
      );

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
