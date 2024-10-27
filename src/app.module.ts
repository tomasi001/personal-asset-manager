// src/app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AssetModule } from './assets/assets.module';
import { AuthModule } from './auth/auth.module';
import { UserIdMiddleware } from './auth/user_id.middleware';
import { DatabaseModule } from './database/database.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AssetModule,
    UserModule,
    PortfolioModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserIdMiddleware).forRoutes('*');
  }
}
