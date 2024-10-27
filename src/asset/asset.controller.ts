import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/user_id.decorator';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';

@Controller('asset')
@UseGuards(AuthGuard)
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  create(@Body() createAssetDto: CreateAssetDto, @UserId() userId: string) {
    return this.assetService.create(createAssetDto, userId);
  }

  @Get()
  findAll(@UserId() userId: string) {
    return this.assetService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @UserId() userId: string) {
    return this.assetService.findOne(id, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @UserId() userId: string) {
    return this.assetService.remove(id, userId);
  }
}
