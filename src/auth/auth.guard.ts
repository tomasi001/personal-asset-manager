import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

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
    } catch (error: any) {
      console.error('Token verification failed:', error.message);
      console.error('Error details:', error);

      // If token verification fails, throw an UnauthorizedException
      throw new UnauthorizedException('Invalid token');
    }
  }

  private getRequest(context: ExecutionContext): Request {
    return context.switchToHttp().getRequest<Request>();
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers?.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async verifyToken(token: string): Promise<any> {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }
    return this.jwtService.verifyAsync(token, { secret: jwtSecret });
  }
}
