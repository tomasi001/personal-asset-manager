import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NewUser, User } from '../database/types';

/**
 * UserService is responsible for handling user-related operations.
 * It provides methods to retrieve, create, and find users in the database.
 */
@Injectable()
export class UserService {
  /**
   * Constructor for UserService.
   * @param databaseService - Injected DatabaseService to interact with the database.
   */
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Retrieves an existing user or creates a new one based on the Privy ID.
   * This method is useful for handling user authentication and onboarding.
   *
   * @param privyId - The unique identifier from the Privy authentication system.
   * @returns A Promise that resolves to the User object.
   */
  async getOrCreateUser(privyId: string): Promise<User> {
    // Get the database instance from the DatabaseService
    const db = this.databaseService.getDb();

    // First, try to find an existing user with the given Privy ID
    const existingUser = await db
      .selectFrom('users')
      .where('privy_id', '=', privyId)
      .selectAll()
      .executeTakeFirst();

    // If a user with the given Privy ID exists, return it
    if (existingUser) {
      return existingUser;
    }

    // If no user was found, we need to create a new one
    // Prepare the new user object with the Privy ID
    const newUser: NewUser = {
      privy_id: privyId,
    };

    // Insert the new user into the database and return the created user
    // We use destructuring to get the first (and only) element of the returned array
    const [createdUser] = await db
      .insertInto('users')
      .values(newUser)
      .returning(['id', 'privy_id', 'created_at', 'updated_at'])
      .execute();

    return createdUser;
  }

  /**
   * Finds a user by their unique database ID.
   * This method is typically used when we need to retrieve user details
   * for operations that require a specific user.
   *
   * @param id - The unique identifier of the user in the database.
   * @returns A Promise that resolves to the User object.
   * @throws NotFoundException if the user is not found.
   */
  async findOne(id: string): Promise<User> {
    // Get the database instance from the DatabaseService
    const db = this.databaseService.getDb();

    // Query the database to find a user with the given ID
    const user = await db
      .selectFrom('users')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst();

    // If no user is found, throw a NotFoundException
    // This helps in providing clear error messages and proper HTTP responses
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // If a user is found, return it
    return user;
  }
}
