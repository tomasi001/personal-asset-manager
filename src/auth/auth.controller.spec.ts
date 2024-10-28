import { UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrivyTokenDto } from './dto/privy-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

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
            validatePrivyToken: jest.fn(),
          },
        },
      ],
    })
      .overrideProvider(ValidationPipe)
      .useValue(new ValidationPipe({ transform: true, whitelist: true }))
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should authenticate a user with a valid Privy token', async () => {
    const validTokenDto: PrivyTokenDto = { privyToken: 'validPrivyToken' };
    const mockAccessToken = 'mockAccessToken';

    jest
      .spyOn(authService, 'validatePrivyToken')
      .mockResolvedValue(new AuthResponseDto(mockAccessToken));

    const result = await controller.authenticate(validTokenDto);
    expect(result).toEqual(new AuthResponseDto(mockAccessToken));
  });

  it('should throw UnauthorizedException if no Privy token is provided', async () => {
    const emptyTokenDto: PrivyTokenDto = { privyToken: '' };
    await expect(controller.authenticate(emptyTokenDto)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException for an invalid Privy token', async () => {
    const invalidTokenDto: PrivyTokenDto = { privyToken: 'invalidPrivyToken' };
    jest
      .spyOn(authService, 'validatePrivyToken')
      .mockRejectedValue(new UnauthorizedException('Invalid Privy token'));

    await expect(controller.authenticate(invalidTokenDto)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
