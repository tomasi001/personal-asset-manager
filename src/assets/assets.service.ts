import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { getErrorMessage } from '../utils';
import { CreateAssetDto } from './dto/create-asset.dto';
import { AssetType } from './enums/ asset-type.enum';
import { AssetHistory, MergedUserAsset } from './interfaces/asset-interfaces';

/**
 * AssetService is responsible for managing digital assets in the application.
 * It handles operations such as creating, retrieving, and deleting assets,
 * as well as managing asset prices and calculating performance metrics.
 *
 * This service interacts with the database to perform CRUD operations on user assets
 * and provides methods for analyzing asset performance over time.
 */
@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Validates that token_id is provided for ERC-721 tokens and not for ERC-20 tokens.
   * ERC-721 tokens are unique and require a token ID, while ERC-20 tokens are fungible and don't.
   *
   * @param {AssetType} assetType - The type of the asset
   * @param {string} [tokenId] - The token ID of the asset (if applicable)
   * @throws {HttpException} If the validation fails
   */
  private validateTokenId(assetType: AssetType, tokenId?: string): void {
    if (assetType === AssetType.ERC721 && !tokenId) {
      throw new HttpException(
        'Token ID is required for ERC-721 assets',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (assetType === AssetType.ERC20 && tokenId) {
      throw new HttpException(
        'Token ID should not be provided for ERC-20 assets',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Validates the quantity for different asset types.
   * ERC-721 tokens should not have a quantity, while ERC-20 tokens must have a positive quantity.
   *
   * @param {AssetType} assetType - The type of the asset
   * @param {number} [quantity] - The quantity of the asset (if applicable)
   * @throws {HttpException} If the validation fails
   */
  private validateTokenQuantity(assetType: AssetType, quantity?: number): void {
    if (assetType === AssetType.ERC721 && quantity !== undefined) {
      throw new HttpException(
        'Quantity should not be provided for ERC-721 assets',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      assetType === AssetType.ERC20 &&
      (quantity === undefined || quantity <= 0)
    ) {
      throw new HttpException(
        'A positive quantity must be provided for ERC-20 assets',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Creates a new asset and adds it to the user's portfolio.
   * If the asset already exists in the global asset list, it's added to the user's portfolio.
   * If it doesn't exist, it's first created in the global asset list, then added to the user's portfolio.
   *
   * @param {CreateAssetDto} createAssetDto - Data Transfer Object containing the asset details
   * @param {string} userId - ID of the user adding the asset
   * @returns {Promise<{ message: string, assetId: string }>} An object containing a success message and the ID of the added asset
   * @throws {HttpException} If there's an error during the creation process
   */
  async create(
    createAssetDto: CreateAssetDto,
    userId: string,
  ): Promise<{ message: string; assetId: string }> {
    this.validateTokenQuantity(
      createAssetDto.asset_type,
      createAssetDto.quantity,
    );
    this.validateTokenId(createAssetDto.asset_type, createAssetDto.token_id);

    const db = this.databaseService.getDb();
    try {
      const asset = await db.transaction().execute(async (trx) => {
        const existingAsset = await trx
          .selectFrom('assets')
          .where('contract_address', '=', createAssetDto.contract_address)
          .where('chain', '=', createAssetDto.chain)
          .where('asset_type', '=', createAssetDto.asset_type)
          .selectAll()
          .executeTakeFirst();

        if (existingAsset) {
          return existingAsset;
        }

        const [newAsset] = await trx
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

        return newAsset;
      });

      await db
        .insertInto('user_assets')
        .values({
          user_id: userId,
          asset_id: asset.id,
          quantity:
            createAssetDto.asset_type === AssetType.ERC721
              ? 1
              : createAssetDto.quantity,
        })
        .execute();

      return {
        message: 'Asset added to user portfolio successfully',
        assetId: asset.id,
      };
    } catch (error) {
      this.logger.error(`Error creating asset: ${getErrorMessage(error)}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'An unexpected error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Retrieves all assets in a user's portfolio.
   *
   * @param {string} userId - ID of the user whose assets are being retrieved
   * @returns {Promise<MergedUserAsset[]>} An array of assets with their details, quantities, and relevant IDs
   */
  async findAll(userId: string): Promise<MergedUserAsset[]> {
    const db = this.databaseService.getDb();
    const results = await db
      .selectFrom('user_assets')
      .innerJoin('assets', 'assets.id', 'user_assets.asset_id')
      .where('user_assets.user_id', '=', userId)
      .select([
        'user_assets.id',
        'user_assets.user_id',
        'user_assets.asset_id',
        'user_assets.quantity',
        'user_assets.created_at',
        'assets.name',
        'assets.asset_type',
        'assets.description',
        'assets.contract_address',
        'assets.chain',
        'assets.token_id',
        'assets.created_at as asset_created_at',
      ])
      .execute();

    return results.map((result) => ({
      ...result,
      asset_type:
        result.asset_type === 'ERC-20' ? AssetType.ERC20 : AssetType.ERC721,
    }));
  }

  /**
   * Retrieves a specific asset from a user's portfolio.
   *
   * @param {string} userAssetId - ID of the user-asset entry to retrieve
   * @param {string} userId - ID of the user who owns the asset
   * @returns {Promise<MergedUserAsset>} The asset details if found
   * @throws {NotFoundException} If the asset is not found in the user's portfolio
   */
  async findOne(userAssetId: string, userId: string): Promise<MergedUserAsset> {
    const db = this.databaseService.getDb();
    const result = await db
      .selectFrom('user_assets')
      .innerJoin('assets', 'assets.id', 'user_assets.asset_id')
      .where('user_assets.id', '=', userAssetId)
      .where('user_assets.user_id', '=', userId)
      .select([
        'user_assets.id',
        'user_assets.user_id',
        'user_assets.asset_id',
        'user_assets.quantity',
        'user_assets.created_at',
        'assets.name',
        'assets.asset_type',
        'assets.description',
        'assets.contract_address',
        'assets.chain',
        'assets.token_id',
        'assets.created_at as asset_created_at',
      ])
      .executeTakeFirst();

    if (!result) {
      throw new NotFoundException(
        `Asset with ID ${userAssetId} not found in user's portfolio`,
      );
    }

    return {
      ...result,
      asset_type:
        result.asset_type === 'ERC-20' ? AssetType.ERC20 : AssetType.ERC721,
    };
  }

  /**
   * Removes a specific asset entry from a user's portfolio.
   *
   * @param {string} userAssetId - ID of the user-asset entry to remove
   * @param {string} userId - ID of the user who owns the asset
   * @returns {Promise<{ message: string }>} An object containing a success message
   * @throws {NotFoundException} If the user-asset entry is not found in the portfolio
   * @throws {BadRequestException} If there's a database error during the removal process
   */
  async remove(
    userAssetId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const db = this.databaseService.getDb();

    try {
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
    } catch (error) {
      this.logger.error(`Failed to remove asset: ${getErrorMessage(error)}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to remove asset from user portfolio',
      );
    }
  }

  /**
   * Retrieves the price history and calculates performance metrics for a specific user asset.
   *
   * @param {string} userAssetId - ID of the user asset entry
   * @param {string} userId - ID of the user who owns the asset
   * @param {Date} [startDate] - Optional start date for the history range
   * @param {Date} [endDate] - Optional end date for the history range
   * @returns {Promise<AssetHistory>} An object containing the price history and performance metrics
   * @throws {NotFoundException} If the user asset is not found
   * @throws {HttpException} If the ERC-20 asset has an invalid quantity
   */
  async getAssetHistory(
    userAssetId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AssetHistory> {
    const userAsset = await this.findOne(userAssetId, userId);
    this.validateUserAsset(userAsset);
    const priceHistory = await this.fetchPriceHistory(
      userAsset.asset_id,
      startDate,
      endDate,
    );

    // if (
    //   userAsset.asset_type === AssetType.ERC20 &&
    //   (userAsset.quantity === null || userAsset.quantity === undefined)
    // ) {
    //   throw new HttpException(
    //     `ERC-20 user asset with ID ${userAssetId} has an invalid quantity`,
    //     HttpStatus.BAD_REQUEST,
    //   );
    // }

    // const db = this.databaseService.getDb();
    // let query = db
    //   .selectFrom('asset_daily_prices')
    //   .where('asset_id', '=', userAsset.asset_id)
    //   .select(['price', 'recorded_at']);

    // if (startDate) {
    //   query = query.where('recorded_at', '>=', startDate);
    // }
    // if (endDate) {
    //   query = query.where('recorded_at', '<=', endDate);
    // }

    // const priceHistory = await query.orderBy('recorded_at', 'asc').execute();

    if (priceHistory.length === 0) {
      return this.createEmptyAssetHistory(userAsset);
    }

    // const initialPrice = priceHistory[0].price;
    // let cumulativePnl = 0;

    // const history = priceHistory.map((entry, index) => {
    //   const value = this.calculateAssetValue(entry.price, userAsset);
    //   const dailyPnl =
    //     index > 0
    //       ? value -
    //         this.calculateAssetValue(priceHistory[index - 1].price, userAsset)
    //       : 0;
    //   cumulativePnl += dailyPnl;
    //   const cumulativePnlPercentage =
    //     ((Number(entry.price) - Number(initialPrice)) / Number(initialPrice)) *
    //     100;

    //   return {
    //     date: entry.recorded_at.toISOString(),
    //     price: entry.price.toFixed(6),
    //     value: Math.round(value),
    //     dailyPnl: Math.round(dailyPnl),
    //     cumulativePnl: Math.round(cumulativePnl),
    //     cumulativePnlPercentage: Number(cumulativePnlPercentage.toFixed(2)),
    //   };
    // });

    // const currentPrice = Number(priceHistory[priceHistory.length - 1].price);
    // const overallPnl = this.calculateOverallPnl(
    //   currentPrice,
    //   initialPrice,
    //   userAsset,
    // );
    // const overallPnlPercentage =
    //   ((currentPrice - Number(initialPrice)) / Number(initialPrice)) * 100;

    // return {
    //   history,
    //   quantity: userAsset.quantity.toFixed(6),
    //   overallPnl: Math.round(overallPnl),
    //   overallPnlPercentage: Number(overallPnlPercentage.toFixed(2)),
    // };

    const initialPrice = Number(priceHistory[0].price);
    const currentPrice = Number(priceHistory[priceHistory.length - 1].price);

    const history = this.calculateHistoryMetrics(
      priceHistory,
      userAsset,
      initialPrice,
    );
    const overallMetrics = this.calculateOverallMetrics(
      currentPrice,
      initialPrice,
      userAsset,
    );

    return {
      history,
      quantity: this.formatQuantity(userAsset.quantity),
      ...overallMetrics,
    };
  }

  /**
   * Updates the prices of all assets in the system.
   * This method simulates price changes for demonstration purposes.
   * In a real-world scenario, you would fetch actual prices from external APIs.
   *
   * @returns {Promise<{ message: string }>} An object containing a success message
   */
  async updateAssetPrices(): Promise<{ message: string }> {
    const db = this.databaseService.getDb();

    const assets = await db
      .selectFrom('assets')
      .select(['id', 'asset_type'])
      .execute();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db.transaction().execute(async (trx) => {
      for (const asset of assets) {
        const latestPrice = await trx
          .selectFrom('asset_daily_prices')
          .where('asset_id', '=', asset.id)
          .orderBy('recorded_at', 'desc')
          .select('price')
          .limit(1)
          .executeTakeFirst();

        const newPrice = latestPrice
          ? latestPrice.price * (1 + (Math.random() - 0.5) * 0.1)
          : Math.random() * 999 + 1;

        await trx
          .insertInto('asset_daily_prices')
          .values({
            asset_id: asset.id,
            price: newPrice,
            recorded_at: today.toISOString(),
          })
          .execute();
      }
    });

    return { message: 'Asset prices updated successfully' };
  }

  private calculateAssetValue(
    price: number,
    userAsset: MergedUserAsset,
  ): number {
    return userAsset.asset_type === AssetType.ERC20
      ? price * Number(userAsset.quantity)
      : price;
  }

  private calculateOverallPnl(
    currentPrice: number,
    initialPrice: number,
    userAsset: MergedUserAsset,
  ): number {
    return userAsset.asset_type === AssetType.ERC20
      ? (currentPrice - initialPrice) * Number(userAsset.quantity)
      : currentPrice - initialPrice;
  }

  private validateUserAsset(userAsset: MergedUserAsset): void {
    if (
      userAsset.asset_type === AssetType.ERC20 &&
      (userAsset.quantity === null || userAsset.quantity === undefined)
    ) {
      throw new BadRequestException(
        `ERC-20 user asset with ID ${userAsset.id} has an invalid quantity`,
      );
    }
  }

  private async fetchPriceHistory(
    assetId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const db = this.databaseService.getDb();
    let query = db
      .selectFrom('asset_daily_prices')
      .where('asset_id', '=', assetId)
      .select(['price', 'recorded_at']);

    if (startDate) query = query.where('recorded_at', '>=', startDate);
    if (endDate) query = query.where('recorded_at', '<=', endDate);

    return query.orderBy('recorded_at', 'asc').execute();
  }

  private formatQuantity(quantity: string | number | null | undefined): string {
    if (quantity === null || quantity === undefined) {
      return '0';
    }
    const numericQuantity = Number(quantity);
    return isNaN(numericQuantity) ? '0' : numericQuantity.toFixed(6);
  }

  private createEmptyAssetHistory(userAsset: MergedUserAsset): AssetHistory {
    return {
      history: [],
      quantity: this.formatQuantity(userAsset.quantity),
      overallPnl: 0,
      overallPnlPercentage: 0,
    };
  }

  private calculateHistoryMetrics(
    priceHistory: Array<{ price: number; recorded_at: Date }>,
    userAsset: MergedUserAsset,
    initialPrice: number,
  ): AssetHistory['history'] {
    let cumulativePnl = 0;

    return priceHistory.map((entry, index) => {
      const price = Number(entry.price);
      const value = this.calculateAssetValue(price, userAsset);
      const dailyPnl =
        index > 0
          ? value -
            this.calculateAssetValue(
              Number(priceHistory[index - 1].price),
              userAsset,
            )
          : 0;
      cumulativePnl += dailyPnl;
      const cumulativePnlPercentage =
        ((price - initialPrice) / initialPrice) * 100;

      return {
        date: entry.recorded_at.toISOString(),
        price: price.toFixed(6),
        value: Math.round(value),
        dailyPnl: Math.round(dailyPnl),
        cumulativePnl: Math.round(cumulativePnl),
        cumulativePnlPercentage: Number(cumulativePnlPercentage.toFixed(2)),
      };
    });
  }

  private calculateOverallMetrics(
    currentPrice: number,
    initialPrice: number,
    userAsset: MergedUserAsset,
  ): Pick<AssetHistory, 'overallPnl' | 'overallPnlPercentage'> {
    const overallPnl = this.calculateOverallPnl(
      currentPrice,
      initialPrice,
      userAsset,
    );
    const overallPnlPercentage =
      ((currentPrice - initialPrice) / initialPrice) * 100;

    return {
      overallPnl: Math.round(overallPnl),
      overallPnlPercentage: Number(overallPnlPercentage.toFixed(2)),
    };
  }
}
