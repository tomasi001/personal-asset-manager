import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/user_id.decorator';
import { AssetService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { Cron } from '@nestjs/schedule';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Asset } from './entities/asset.entity';

@ApiTags('assets')
@ApiBearerAuth('JWT-auth')
@Controller('assets')
@UseGuards(AuthGuard)
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @ApiOperation({ summary: 'Add an asset to user portfolio' })
  @ApiResponse({
    status: 201,
    description: 'The asset has been successfully added to the user portfolio.',
  })
  create(@Body() createAssetDto: CreateAssetDto, @UserId() userId: string) {
    return this.assetService.create(createAssetDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assets in user portfolio' })
  @ApiResponse({
    status: 200,
    description: 'Return all assets in the user portfolio.',
    type: [Asset],
  })
  findAll(@UserId() userId: string) {
    return this.assetService.findAll(userId);
  }

  @Get(':userAssetId')
  @ApiOperation({ summary: 'Get a specific asset from user portfolio' })
  @ApiParam({ name: 'userAssetId', description: 'Asset ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the asset from user portfolio.',
    type: Asset,
  })
  @ApiResponse({
    status: 404,
    description: 'Asset not found in user portfolio.',
  })
  findOne(@Param('userAssetId') userAssetId: string, @UserId() userId: string) {
    return this.assetService.findOne(userAssetId, userId);
  }

  @Delete(':userAssetId')
  @ApiOperation({
    summary: 'Remove a specific asset entry from user portfolio',
  })
  @ApiParam({ name: 'userAssetId', description: 'User-Asset ID' })
  @ApiResponse({
    status: 200,
    description:
      'The asset entry has been successfully removed from the user portfolio.',
  })
  @ApiResponse({
    status: 404,
    description: 'User-asset entry not found in the portfolio.',
  })
  remove(@Param('userAssetId') userAssetId: string, @UserId() userId: string) {
    return this.assetService.remove(userAssetId, userId);
  }

  @Get(':userAssetId/history')
  @ApiOperation({ summary: 'Get asset price history' })
  @ApiParam({ name: 'userAssetId', description: 'Asset ID' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for history (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for history (YYYY-MM-DD)',
  })
  @ApiResponse({ status: 200, description: 'Return the asset price history.' })
  @ApiResponse({ status: 404, description: 'Asset not found.' })
  getAssetHistory(
    @Param('userAssetId') userAssetId: string,
    @UserId() userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.assetService.getAssetHistory(
      userAssetId,
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Post('update-prices')
  @ApiOperation({ summary: 'Manually update asset prices' })
  @ApiResponse({
    status: 200,
    description: 'Asset prices updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Error updating asset prices.',
  })
  async manualUpdatePrices() {
    try {
      await this.updatePrices();
      return { message: 'Asset prices updated successfully' };
    } catch (error: unknown) {
      // Log the error for debugging purposes
      console.error('Error updating asset prices:', error);

      // Check if error is an instance of Error
      if (error instanceof Error) {
        // Check for specific error types
        if (
          error.message.includes(
            'duplicate key value violates unique constraint',
          )
        ) {
          throw new HttpException(
            'Asset prices have already been updated for this time period.',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Generic error response
      throw new HttpException(
        'Error updating asset prices. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Cron('0 0 * * *') // Run at midnight every day
  @ApiOperation({ summary: 'Automatically update asset prices daily' })
  async handleDailyPriceUpdate() {
    await this.updatePrices();
  }

  private async updatePrices() {
    await this.assetService.updateAssetPrices();
  }
}
