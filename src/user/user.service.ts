import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NewUser, User } from '../database/types';

@Injectable()
export class UserService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getOrCreateUser(privyId: string): Promise<User> {
    const db = this.databaseService.getDb();

    // Try to find the user first
    const existingUser = await db
      .selectFrom('users')
      .where('privy_id', '=', privyId)
      .selectAll()
      .executeTakeFirst();

    if (existingUser) {
      return existingUser;
    }

    // If user doesn't exist, create a new one
    const newUser: NewUser = {
      privy_id: privyId,
    };

    const [createdUser] = await db
      .insertInto('users')
      .values(newUser)
      .returning(['id', 'privy_id', 'created_at', 'updated_at'])
      .execute();

    return createdUser;
  }

  async findOne(id: string): Promise<User> {
    const db = this.databaseService.getDb();
    const user = await db
      .selectFrom('users')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }
}
