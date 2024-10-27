import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

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
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        privyToken: { type: 'string' },
      },
      required: ['privyToken'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Successfully authenticated',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Unauthorized - Invalid or missing Privy token',
  })
  async authenticate(@Body('privyToken') privyToken: string) {
    if (!privyToken) {
      throw new UnauthorizedException('Privy token must be provided');
    }

    return this.authService.validatePrivyToken(privyToken);
  }
}
