import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getErrorMessage } from '../utils';

/**
 * UserIdMiddleware
 *
 * Purpose:
 * This middleware extracts the user ID from the JWT token in the request's
 * Authorization header and attaches it to the request object for later use.
 *
 * Why this file exists:
 * 1. To centralize the logic for extracting user information from JWT tokens.
 * 2. To make the user ID easily accessible in subsequent request handlers without
 *    repeating token verification logic.
 * 3. To separate authentication concerns from the main application logic.
 *
 * How it works:
 * 1. It intercepts incoming requests before they reach the route handlers.
 * 2. It checks for a JWT token in the Authorization header.
 * 3. If a token is found, it attempts to verify and decode it.
 * 4. If successful, it attaches the user ID to the request object.
 *
 * Note: This middleware does not block requests with invalid tokens. It leaves
 * that responsibility to the AuthGuard
 */
@Injectable()
export class UserIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(UserIdMiddleware.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }
    // Extract the token from the Authorization header
    // The header format is expected to be: "Bearer <token>"
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return next();
    }

    if (token) {
      try {
        // Attempt to verify and decode the token
        const decoded = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });

        // If successful, attach the userId to the request object
        // This makes the userId available to subsequent request handlers
        if (typeof decoded === 'object' && 'userId' in decoded) {
          req['userId'] = decoded.userId;
        } else {
          this.logger.warn('JWT payload does not contain userId');
        }
      } catch (error) {
        // Token verification failed
        // We don't throw an error here because:
        // 1. The request might be for a public route that doesn't require authentication
        // 2. We want to let the AuthGuard or similar mechanism handle authentication failures
        // 3. This middleware's primary purpose is to extract info, not to enforce auth
        this.logger.warn(`Failed to verify token: ${getErrorMessage(error)}`);
      }
    }

    // Always call next() to pass control to the next middleware or route handler
    // This ensures that the request continues to be processed, regardless of whether
    // a valid token was found or not
    next();
  }
}
