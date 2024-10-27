// src/app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AssetModule } from './assets/assets.module';
import { UserModule } from './user/user.module';
import { UserIdMiddleware } from './auth/user_id.middleware';
import { PortfolioModule } from './portfolio/portfolio.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AssetModule,
    UserModule,
    PortfolioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserIdMiddleware).forRoutes('*');
  }
}
