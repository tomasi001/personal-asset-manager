// src/database/database.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kysely } from 'kysely';
import { getKyselyInstance } from './kysely.config';
import { Database } from './types'; // Define your DB types separately

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly db: Kysely<Database>;

  constructor() {
    this.db = getKyselyInstance();
  }

  async onModuleInit() {
    console.log('Database connection initialized.');
  }

  async onModuleDestroy() {
    await this.db.destroy();
    console.log('Database connection closed.');
  }

  getDb(): Kysely<Database> {
    return this.db;
  }
}
