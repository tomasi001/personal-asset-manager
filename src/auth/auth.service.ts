// src/auth/auth.service.ts
import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenClaims, PrivyClient } from '@privy-io/server-auth';
import { UserService } from '../user/user.service';
import { getErrorMessage } from '../utils';

/**
 * AuthService is responsible for handling authentication-related tasks.
 * It interacts with the Privy.io service to validate tokens and generate JWTs.
 */
@Injectable()
export class AuthService {
  private readonly privy: PrivyClient;
  private readonly logger = new Logger(AuthService.name);

  /**
   * Constructor for AuthService.
   * Initializes the PrivyClient with application credentials from the configuration service.
   *
   * @param jwtService - Service for handling JSON Web Tokens.
   * @param configService - Service for accessing application configuration.
   */
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    const appId = this.configService.get<string>('PRIVY_APP_ID');
    const appSecret = this.configService.get<string>('PRIVY_APP_SECRET');

    // Initialize the PrivyClient with the application ID and secret.
    this.privy = new PrivyClient(appId, appSecret);
  }

  /**
   * Validates a Privy.io token and generates a corresponding JWT.
   *
   * @param privyToken - The token issued by Privy.io that needs to be validated.
   * @returns An object containing the generated access token if validation is successful.
   * @throws UnauthorizedException if the token is invalid.
   */
  async validatePrivyToken(privyToken: string) {
    try {
      // Verify the Privy.io token using verifyAuthToken method.
      const claims: AuthTokenClaims =
        await this.privy.verifyAuthToken(privyToken);

      const privyId = claims.userId;

      const user = await this.userService.getOrCreateUser(privyId);

      const payload = {
        userId: user.id,
        sub: user.id,
        privyId: privyId,
        iat: Math.floor(Date.now() / 1000),
      };

      // Generate our own JWT using the user ID from the claims.
      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '1h',
      });

      this.logger.debug(`JWT generated for user ${user.id}`);
      // Return the generated access token.
      return { accessToken };
    } catch (error) {
      this.logger.error(
        `Failed to validate Privy token: ${getErrorMessage(error)}`,
      );
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired Privy token');
    }
  }
}
