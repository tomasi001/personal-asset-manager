import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { DatabaseModule } from '../database/database.module';
import { AssetModule } from '../assets/assets.module';
import { AssetService } from '../assets/assets.service';

@Module({
  imports: [DatabaseModule, AssetModule],
  controllers: [PortfolioController],
  providers: [PortfolioService, AssetService],
})
export class PortfolioModule {}
