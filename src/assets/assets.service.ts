import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateAssetDto } from './dto/create-asset.dto';

/**
 * AssetService is responsible for managing digital assets in the application.
 * It handles operations such as creating, retrieving, and deleting assets,
 * as well as managing asset prices and calculating performance metrics.
 *
 * This service interacts with the database to perform CRUD operations on users assets
 * and provides methods for analyzing asset performance over time.
 */
@Injectable()
export class AssetService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Validates that token_id is provided for ERC-721 tokens and not for ERC-20 tokens.
   * ERC-721 tokens are unique and require a token ID, while ERC-20 tokens are fungible and don't.
   *
   * @param assetType - The type of the asset (ERC-20 or ERC-721)
   * @param tokenId - The token ID of the asset (if applicable)
   * @throws Error if the validation fails
   */
  private validateTokenId(
    assetType: 'ERC-20' | 'ERC-721',
    tokenId?: string,
  ): void {
    if (assetType === 'ERC-721' && !tokenId) {
      throw new Error('Token ID is required for ERC-721 assets');
    }
    if (assetType === 'ERC-20' && tokenId) {
      throw new Error('Token ID should not be provided for ERC-20 assets');
    }
  }

  /**
   * Creates a new asset and adds it to the user's portfolio.
   * If the asset already exists in the global asset list, it's added to the user's portfolio.
   * If it doesn't exist, it's first created in the global asset list, then added to the user's portfolio.
   *
   * @param createAssetDto - Data Transfer Object containing the asset details
   * @param userId - ID of the user adding the asset
   * @returns An object containing a success message and the ID of the added asset
   */
  async create(createAssetDto: CreateAssetDto, userId: string) {
    try {
      // Validate the token ID based on the asset type
      this.validateTokenId(createAssetDto.asset_type, createAssetDto.token_id);

      const db = this.databaseService.getDb();

      // Check if the asset already exists in the assets table
      let asset = await db
        .selectFrom('assets')
        .where('contract_address', '=', createAssetDto.contract_address)
        .where('chain', '=', createAssetDto.chain)
        .where('asset_type', '=', createAssetDto.asset_type)
        .selectAll()
        .executeTakeFirst();

      // If the asset doesn't exist, create it
      if (!asset) {
        const [newAsset] = await db
          .insertInto('assets')
          .values({
            name: createAssetDto.name,
            asset_type: createAssetDto.asset_type,
            description: createAssetDto.description,
            contract_address: createAssetDto.contract_address,
            chain: createAssetDto.chain,
            token_id: createAssetDto.token_id,
          })
          .returning([
            'id',
            'name',
            'asset_type',
            'description',
            'contract_address',
            'chain',
            'token_id',
            'created_at',
          ])
          .execute();
        asset = newAsset;
      }

      // Add the asset to the user's portfolio
      await db
        .insertInto('user_assets')
        .values({
          user_id: userId,
          asset_id: asset.id,
          quantity:
            createAssetDto.asset_type === 'ERC-20'
              ? createAssetDto.quantity
              : undefined,
        })
        .execute();

      return {
        message: 'Asset added to user portfolio successfully',
        assetId: asset.id,
      };
    } catch (error) {
      // Handle specific errors
      if (error instanceof Error) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      // Handle unexpected errors
      throw new HttpException(
        'An unexpected error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Retrieves all assets in a user's portfolio.
   *
   * @param userId - ID of the user whose assets are being retrieved
   * @returns An array of assets with their details, quantities, and relevant IDs
   */
  async findAll(userId: string) {
    const db = this.databaseService.getDb();
    return db
      .selectFrom('user_assets')
      .innerJoin('assets', 'assets.id', 'user_assets.asset_id')
      .where('user_assets.user_id', '=', userId)
      .select([
        'user_assets.id as id',
        'assets.id as assetId',
        'assets.name',
        'assets.asset_type',
        'assets.description',
        'assets.contract_address',
        'assets.chain',
        'assets.token_id',
        'assets.created_at',
        'user_assets.quantity',
      ])
      .execute();
  }

  /**
   * Retrieves a specific asset from a user's portfolio.
   *
   * @param userAssetId - ID of the user-asset entry to retrieve
   * @param userId - ID of the user who owns the asset
   * @returns The asset details if found
   * @throws NotFoundException if the asset is not found in the user's portfolio
   */
  async findOne(userAssetId: string, userId: string) {
    const db = this.databaseService.getDb();
    const result = await db
      .selectFrom('user_assets')
      .innerJoin('assets', 'assets.id', 'user_assets.asset_id')
      .where('user_assets.id', '=', userAssetId)
      .where('user_assets.user_id', '=', userId)
      .select([
        'user_assets.id as userAssetId',
        'assets.id as assetId',
        'assets.name',
        'assets.asset_type',
        'assets.description',
        'assets.contract_address',
        'assets.chain',
        'assets.token_id',
        'assets.created_at',
        'user_assets.quantity',
      ])
      .executeTakeFirst();

    if (!result) {
      throw new NotFoundException(
        `Asset with ID ${userAssetId} not found in user's portfolio`,
      );
    }

    return result;
  }

  /**
   * Removes a specific asset entry from a user's portfolio.
   *
   * @param userAssetId - ID of the user-asset entry to remove
   * @param userId - ID of the user who owns the asset
   * @returns An object containing a success message
   * @throws NotFoundException if the user-asset entry is not found
   */
  async remove(userAssetId: string, userId: string) {
    const db = this.databaseService.getDb();

    // Remove the specific user-asset entry from the user's portfolio
    const result = await db
      .deleteFrom('user_assets')
      .where('id', '=', userAssetId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!result || result.numDeletedRows === 0n) {
      throw new NotFoundException(
        'User-asset entry not found in the portfolio',
      );
    }

    return { message: 'Asset removed from user portfolio successfully' };
  }

  /**
   * Retrieves the price history and calculates performance metrics for a specific user asset.
   * @param userAssetId - ID of the user asset entry
   * @param userId - ID of the user who owns the asset
   * @param startDate - Optional start date for the history range
   * @param endDate - Optional end date for the history range
   * @returns An object containing the price history and performance metrics
   */
  async getAssetHistory(
    userAssetId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const db = this.databaseService.getDb();

    // Fetch the user asset and related asset information
    const userAsset = await this.findOne(userAssetId, userId);
    if (!userAsset) {
      throw new NotFoundException(
        `User asset with ID ${userAssetId} not found for this user`,
      );
    }

    if (
      userAsset.asset_type === 'ERC-20' &&
      (userAsset.quantity === null || userAsset.quantity === undefined)
    ) {
      throw new Error(
        `ERC-20 user asset with ID ${userAssetId} has an invalid quantity`,
      );
    }

    // Fetch the price history
    let query = db
      .selectFrom('asset_daily_prices')
      .where('asset_id', '=', userAsset.assetId)
      .select(['price', 'recorded_at']);

    // Add date range filter if provided
    if (startDate) {
      query = query.where('recorded_at', '>=', startDate);
    }
    if (endDate) {
      query = query.where('recorded_at', '<=', endDate);
    }

    const priceHistory = await query.orderBy('recorded_at', 'asc').execute();

    // If no price history is found, return empty results
    if (priceHistory.length === 0) {
      return {
        history: [],
        pnl: 0,
        pnlPercentage: 0,
        quantity: userAsset.quantity,
      };
    }

    const initialPrice = priceHistory[0].price;
    let cumulativePnl = 0;

    // Calculate daily performance metrics
    const history = priceHistory.map((entry, index) => {
      const value =
        userAsset.asset_type === 'ERC-20'
          ? entry.price * userAsset.quantity
          : entry.price;
      const dailyPnl =
        index > 0
          ? value -
            (userAsset.asset_type === 'ERC-20'
              ? priceHistory[index - 1].price * userAsset.quantity
              : priceHistory[index - 1].price)
          : 0;
      cumulativePnl += dailyPnl;
      const cumulativePnlPercentage =
        ((entry.price - initialPrice) / initialPrice) * 100;

      return {
        date: entry.recorded_at,
        price: entry.price,
        value,
        dailyPnl,
        cumulativePnl,
        cumulativePnlPercentage,
      };
    });

    // Calculate overall performance metrics
    const currentPrice = priceHistory[priceHistory.length - 1].price;
    const overallPnl =
      userAsset.asset_type === 'ERC-20'
        ? (currentPrice - initialPrice) * userAsset.quantity
        : currentPrice - initialPrice;
    const overallPnlPercentage =
      ((currentPrice - initialPrice) / initialPrice) * 100;

    return {
      history,
      quantity: userAsset.quantity,
      overallPnl,
      overallPnlPercentage,
    };
  }

  /**
   * Updates the prices of all assets in the system.
   * This method simulates price changes for demonstration purposes.
   * In a real-world scenario, you would fetch actual prices from external APIs.
   * @returns An object containing a success message
   */
  async updateAssetPrices() {
    const db = this.databaseService.getDb();

    // Get all assets from the database
    const assets = await db
      .selectFrom('assets')
      .select(['id', 'asset_type'])
      .execute();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day

    for (const asset of assets) {
      // Get the latest price for this asset
      const latestPrice = await db
        .selectFrom('asset_daily_prices')
        .where('asset_id', '=', asset.id)
        .orderBy('recorded_at', 'desc')
        .select('price')
        .limit(1)
        .executeTakeFirst();

      let newPrice;
      if (latestPrice) {
        // Generate a random price fluctuation between -5% and +5%
        const fluctuation = (Math.random() - 0.5) * 0.1;
        newPrice = latestPrice.price * (1 + fluctuation);
      } else {
        // If no previous price exists, generate a random price between 1 and 1000
        newPrice = Math.random() * 999 + 1;
      }

      // Insert new price into asset_daily_prices
      await db
        .insertInto('asset_daily_prices')
        .values({
          asset_id: asset.id,
          price: newPrice,
          recorded_at: today.toISOString(),
        })
        .execute();
    }

    return { message: 'Asset prices updated successfully' };
  }
}
