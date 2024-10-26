// src/auth/auth.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * AuthGuard is a custom guard that implements the CanActivate interface.
 * It is responsible for protecting routes by verifying the presence and validity of a JWT.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * The canActivate method is called to determine if a request should be allowed to proceed.
   * @param context - The execution context that contains information about the current request.
   * @returns boolean - Returns true if the request is allowed, false otherwise.
   */
  canActivate(context: ExecutionContext): boolean {
    // Get the request object from the execution context
    const request = context.switchToHttp().getRequest();

    // Extract the token from the Authorization header
    const token = request.headers.authorization?.split(' ')[1]; // Assuming Bearer token format

    // If no token is provided, throw an UnauthorizedException
    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    try {
      // Verify the token using the JwtService
      const payload = this.jwtService.verify(token);

      // Attach the user information (payload) to the request object for later use
      request.user = payload; // This allows access to user info in the route handler
      return true; // Allow the request to proceed
    } catch {
      // If token verification fails, throw an UnauthorizedException
      throw new UnauthorizedException('Invalid token');
    }
  }
}
