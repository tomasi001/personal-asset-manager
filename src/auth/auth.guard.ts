import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getErrorMessage } from '../utils';
import { JwtPayload } from './interfaces/jwt.interface';

/**
 * AuthGuard is a custom guard that implements the CanActivate interface.
 * It is responsible for protecting routes by verifying the presence and validity of a JWT.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * The canActivate method is called to determine if a request should be allowed to proceed.
   * @param context - The execution context that contains information about the current request.
   * @returns boolean - Returns true if the request is allowed, false otherwise.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the request object from the execution context
    const request = context.switchToHttp().getRequest();

    // Extract the token from the Authorization header
    const token = this.extractTokenFromHeader(request);

    // If no token is provided, throw an UnauthorizedException
    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      // Verify the token using the JwtService
      const payload = await this.verifyToken(token);

      // Attach the user information (payload) to the request object for later use
      request['user'] = payload; // This allows access to user info in the route handler
      return true; // Allow the request to proceed
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('Token verification failed:', errorMessage);

      // If token verification fails, throw an UnauthorizedException
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: unknown): string | undefined {
    if (request && typeof request === 'object' && 'headers' in request) {
      const headers = request.headers;
      if (
        headers &&
        typeof headers === 'object' &&
        'authorization' in headers
      ) {
        const authHeader = headers.authorization;
        if (typeof authHeader === 'string') {
          const [type, token] = authHeader.split(' ');
          return type === 'Bearer' ? token : undefined;
        }
      }
    }
    return undefined;
  }

  private async verifyToken(token: string): Promise<JwtPayload> {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, { secret: jwtSecret });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('Token verification failed:', errorMessage);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
