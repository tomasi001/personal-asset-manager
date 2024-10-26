// src/auth/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard'; // Import AuthGuard

/**
 * AuthController handles authentication-related requests.
 * It provides endpoints for user authentication and protected routes.
 */
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
  async authenticate(@Body('privyToken') privyToken: string) {
    if (!privyToken) {
      throw new UnauthorizedException('Privy token must be provided');
    }

    try {
      const result = await this.authService.validatePrivyToken(privyToken);
      return { accessToken: result.accessToken }; // Return the generated JWT
    } catch (error) {
      throw new UnauthorizedException('Invalid Privy token'); // Handle errors gracefully
    }
  }

  /**
   * A protected route that can only be accessed by authenticated users.
   * The AuthGuard is applied to this route to ensure that only requests with a valid JWT can access it.
   * @returns A message indicating that the route is protected.
   */
  @UseGuards(AuthGuard) // Protect this route with the AuthGuard
  @Post('protected')
  async protectedRoute() {
    return { message: 'This is a protected route' }; // Response for authenticated users
  }
}
