import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

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
  (data: unknown, ctx: ExecutionContext) => {
    // Get the request object from the execution context
    const request = ctx.switchToHttp().getRequest();

    // Extract the token from the Authorization header
    // The header format is expected to be: "Bearer <token>"
    const token = request.headers.authorization?.split(' ')[1];

    if (token) {
      try {
        // Create a new instance of JwtService
        // Note: In a real-world scenario, it's better to inject JwtService instead of creating a new instance
        const jwtService = new JwtService({ secret: process.env.JWT_SECRET });

        // Verify and decode the token
        const decoded = jwtService.verify(token);

        // Return the userId from the decoded token
        return decoded.userId;
      } catch {
        // Token verification failed
        // We don't throw an error here because:
        // 1. The decorator's role is to extract info, not to enforce authentication
        // 2. We want to let the AuthGuard or similar mechanism handle authentication failures
        // 3. Returning null allows the calling code to handle the absence of a valid userId
      }
    }

    // Return null if no token was found or if verification failed
    return null;
  },
);
