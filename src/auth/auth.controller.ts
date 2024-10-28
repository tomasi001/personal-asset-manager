import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { PrivyTokenDto } from './dto/privy-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

/**
 * AuthController handles authentication-related requests.
 * It provides endpoints for user authentication and protected routes.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Authenticates a user by validating a Privy token and issuing a JWT.
   * @param privyToken - The token issued by Privy.io that needs to be validated.
   * @returns An object containing the generated access token if validation is successful.
   * @throws UnauthorizedException if the token is invalid or not provided.
   */
  @Post()
  @ApiOperation({ summary: 'Authenticate user with Privy token' })
  @ApiBody({ type: PrivyTokenDto })
  @ApiResponse({
    status: 201,
    description: 'Successfully authenticated',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Unauthorized - Invalid or missing Privy token',
  })
  async authenticate(
    @Body(ValidationPipe) privyTokenDto: PrivyTokenDto,
  ): Promise<AuthResponseDto> {
    const { privyToken } = privyTokenDto;

    if (!privyToken) {
      throw new UnauthorizedException('Privy token must be provided');
    }

    return this.authService.validatePrivyToken(privyToken);
  }
}
