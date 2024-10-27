// src/database/database.module.ts
import { Global, Module } from '@nestjs/common';
import { DatabaseController } from './database.controller';
import { DatabaseService } from './database.service';

// Marks this module as globally available (no need to import in every other module)
@Global()
@Module({
  controllers: [DatabaseController], // Ensure the controller is registered here
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
