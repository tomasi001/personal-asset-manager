import { Controller, Get, UseGuards } from '@nestjs/common';
import { DatabaseService } from './database.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { ConfigService } from '@nestjs/config';

@ApiTags('database')
@ApiBearerAuth('JWT-auth')
@Controller('database')
@UseGuards(AuthGuard)
export class DatabaseController {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Check database connection status' })
  @ApiResponse({
    status: 200,
    description: 'Returns the status of the database connection',
    schema: {
      type: 'string',
      example: 'Database connection is healthy!',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      type: 'string',
      example: 'Database connection failed!',
    },
  })
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
