import { createParamDecorator, ExecutionContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getErrorMessage } from '../utils';

/**
 * UserId Decorator
 *
 * Purpose:
 * This custom decorator extracts the user ID from the JWT token in the request's
 * Authorization header and makes it available as a parameter in controller methods.
 *
 * Why this file exists:
 * 1. To provide a convenient way to access the authenticated user's ID in controllers.
 * 2. To encapsulate the token extraction and verification logic in a reusable decorator.
 * 3. To separate authentication-related concerns from the main business logic in controllers.
 *
 * How it works:
 * 1. It's used as a parameter decorator in controller methods.
 * 2. When the decorated parameter is accessed, it extracts the JWT token from the request.
 * 3. It verifies the token and extracts the user ID.
 * 4. It returns the user ID, making it directly available in the controller method.
 *
 * Usage example in a controller:
 * @Get('profile')
 * getProfile(@UserId() userId: string) {
 *   return this.userService.getProfile(userId);
 * }
 *
 * Note: This decorator does not enforce authentication. It should be used in
 * conjunction with guards or other authentication mechanisms.
 */
export const UserId = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<string | null> => {
    const logger = new Logger('UserIdDecorator');
    const configService = new ConfigService();
    const jwtService = new JwtService({
      secret: configService.get<string>('JWT_SECRET'),
    });

    // Get the request object from the execution context
    const request = ctx.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      logger.debug('No authorization header found');
      return null;
    }

    // Extract the token from the Authorization header
    // The header format is expected to be: "Bearer <token>"
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      logger.debug('Invalid authorization header format');
      return null;
    }

    if (token) {
      try {
        // Verify and decode the token
        const decoded = await jwtService.verifyAsync(token);

        // Return the userId from the decoded token
        if (typeof decoded === 'object' && 'userId' in decoded) {
          return decoded.userId as string;
        }
      } catch (error) {
        // Token verification failed
        // We don't throw an error here because:
        // 1. The decorator's role is to extract info, not to enforce authentication
        // 2. We want to let the AuthGuard or similar mechanism handle authentication failures
        // 3. Returning null allows the calling code to handle the absence of a valid userId
        logger.warn(`Failed to verify token:  ${getErrorMessage(error)}`);
      }
    }

    // Return null if no token was found or if verification failed
    logger.warn('JWT payload does not contain userId');
    return null;
  },
);
