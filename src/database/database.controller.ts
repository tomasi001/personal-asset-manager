// src/database/database.controller.ts
import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('database')
export class DatabaseController {
  constructor(private readonly dbService: DatabaseService) {}

  @Get('status')
  async getStatus(): Promise<string> {
    try {
      await this.dbService
        .getDb()
        .selectFrom('users')
        .select('id')
        .limit(1)
        .execute(); // Adjusted to use select
      return 'Database connection is healthy!';
    } catch (error) {
      console.error('Database connection error:', error);
      return 'Database connection failed!';
    }
  }
}
