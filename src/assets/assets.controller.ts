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
import { Cron } from '@nestjs/schedule';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/user_id.decorator';
import { AssetService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import {
  AssetHistoryResponse,
  MergedUserAssetResponse,
} from './responses/asset-responses';

/**
 * Controller for managing user assets and asset-related operations.
 * Handles CRUD operations for assets, retrieves asset history, and manages asset price updates.
 */
@ApiTags('assets')
@ApiBearerAuth('JWT-auth')
@Controller('assets')
@UseGuards(AuthGuard)
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  /**
   * Creates a new asset in the user's portfolio.
   * @param {CreateAssetDto} createAssetDto - The data for creating a new asset.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<{ message: string; assetId: string }>} The result of the asset creation.
   */
  @Post()
  @ApiOperation({ summary: 'Add an asset to user portfolio' })
  @ApiResponse({
    status: 201,
    description: 'The asset has been successfully added to the user portfolio.',
  })
  create(
    @Body() createAssetDto: CreateAssetDto,
    @UserId() userId: string,
  ): Promise<{ message: string; assetId: string }> {
    return this.assetService.create(createAssetDto, userId);
  }

  /**
   * Retrieves all assets in the user's portfolio.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<MergedUserAssetResponse[]>} An array of assets in the user's portfolio.
   */
  @Get()
  @ApiOperation({ summary: 'Get all assets in user portfolio' })
  @ApiResponse({
    status: 200,
    description: 'Return all assets in the user portfolio.',
    type: [MergedUserAssetResponse],
  })
  findAll(@UserId() userId: string) {
    return this.assetService.findAll(userId);
  }

  /**
   * Retrieves a specific asset from the user's portfolio.
   * @param {string} userAssetId - The ID of the user-asset entry.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<MergedUserAssetResponse>} The requested asset.
   */
  @Get(':userAssetId')
  @ApiOperation({ summary: 'Get a specific asset from user portfolio' })
  @ApiParam({ name: 'userAssetId', description: 'Asset ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the asset from user portfolio.',
    type: MergedUserAssetResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Asset not found in user portfolio.',
  })
  findOne(@Param('userAssetId') userAssetId: string, @UserId() userId: string) {
    return this.assetService.findOne(userAssetId, userId);
  }

  /**
   * Removes a specific asset entry from the user's portfolio.
   * @param {string} userAssetId - The ID of the user-asset entry to remove.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<{ message: string }>} A success message.
   */
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

  /**
   * Retrieves the price history and performance metrics for a specific asset.
   * @param {string} userAssetId - The ID of the user-asset entry.
   * @param {string} userId - The ID of the user.
   * @param {string} [startDate] - The start date for the history (YYYY-MM-DD).
   * @param {string} [endDate] - The end date for the history (YYYY-MM-DD).
   * @returns {Promise<AssetHistoryResponse>} The asset price history and performance metrics.
   */
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
  @ApiResponse({
    status: 200,
    description: 'Return the asset price history.',
    type: AssetHistoryResponse,
  })
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

  /**
   * Manually updates asset prices.
   * @returns {Promise<{ message: string }>} A success message.
   * @throws {HttpException} If there's an error updating asset prices.
   */
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

  /**
   * Automatically updates asset prices daily at midnight.
   */
  @Cron('0 0 * * *') // Run at midnight every day
  @ApiOperation({ summary: 'Automatically update asset prices daily' })
  async handleDailyPriceUpdate() {
    await this.updatePrices();
  }

  /**
   * Private method to update asset prices.
   * @private
   */
  private async updatePrices() {
    await this.assetService.updateAssetPrices();
  }
}
