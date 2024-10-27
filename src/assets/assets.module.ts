import { Module } from '@nestjs/common';
import { AssetService } from './assets.service';
import { AssetController } from './assets.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AssetController],
  providers: [AssetService],
})
export class AssetModule {}
