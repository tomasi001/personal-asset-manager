import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kysely } from 'kysely';
import { getKyselyInstance } from './kysely.config';
import { Database } from './types';

/**
 * DatabaseService
 *
 * This service is responsible for managing the database connection in the application.
 * It uses Kysely as the SQL query builder for type-safe database operations.
 *
 * @Injectable() - This decorator marks the class as a provider that can be managed by Nest's dependency injection container.
 *
 * The class implements OnModuleInit and OnModuleDestroy interfaces, which allow us to run code when the module is initialized and destroyed.
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  // Private readonly property to store the Kysely instance
  // We use private to encapsulate the db instance and readonly to prevent accidental modifications
  private readonly db: Kysely<Database>;

  /**
   * Constructor
   *
   * Initializes the Kysely instance when the service is created.
   * We use getKyselyInstance() to create and configure the Kysely instance.
   * This approach allows us to keep the configuration logic separate from the service.
   */
  constructor() {
    this.db = getKyselyInstance();
  }

  /**
   * onModuleInit
   *
   * This method is called once the host module's dependencies have been resolved.
   * It's a good place to perform any necessary setup or logging.
   *
   * In this case, we're simply logging that the database connection has been initialized.
   * You could add more complex initialization logic here if needed.
   */
  async onModuleInit() {
    console.log('Database connection initialized.');
  }

  /**
   * onModuleDestroy
   *
   * This method is called just before the host module is destroyed.
   * It's used to perform cleanup operations, like closing database connections.
   *
   * Here, we're destroying the Kysely instance (which closes the database connection)
   * and logging that the connection has been closed.
   */
  async onModuleDestroy() {
    await this.db.destroy();
    console.log('Database connection closed.');
  }

  /**
   * getDb
   *
   * This method provides controlled access to the Kysely instance.
   * It allows other parts of the application to use the database connection
   * without directly exposing the private db property.
   *
   * @returns {Kysely<Database>} The Kysely instance for database operations
   */
  getDb(): Kysely<Database> {
    return this.db;
  }
}
