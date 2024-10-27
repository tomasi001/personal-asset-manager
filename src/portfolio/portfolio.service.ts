import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AssetService } from '../assets/assets.service';

/**
 * PortfolioService is responsible for managing and calculating portfolio-related data.
 * It uses DatabaseService for database operations and AssetService for asset-related operations.
 */
@Injectable()
export class PortfolioService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly assetService: AssetService,
  ) {}

  /**
   * Calculates the total portfolio value, Profit and Loss (PnL), and PnL percentage for a given user.
   *
   * @param userId - The unique identifier of the user whose portfolio we're calculating.
   * @returns An object containing totalValue, pnl, and pnlPercentage.
   */
  async getPortfolioValueAndPnL(userId: string) {
    // First, we fetch all assets for the given user
    const assets = await this.assetService.findAll(userId);

    // If the user has no assets, we return default values to avoid unnecessary calculations
    if (assets.length === 0) {
      return {
        totalValue: 0,
        pnl: 0,
        pnlPercentage: 0,
      };
    }

    // Get the database instance to perform queries
    const db = this.databaseService.getDb();

    // Initialize variables to keep track of total value and cost
    let totalValue = 0;
    let totalCost = 0;

    // Iterate through each asset to calculate its value and cost
    for (const asset of assets) {
      // We use Promise.all to fetch the latest and initial prices concurrently,
      // improving performance by running these queries in parallel
      const [latestPrice, initialPrice] = await Promise.all([
        // Query to get the most recent price for the asset
        db
          .selectFrom('asset_daily_prices')
          .where('asset_id', '=', asset.assetId)
          .orderBy('recorded_at', 'desc')
          .select('price')
          .limit(1)
          .executeTakeFirst(),
        // Query to get the initial (oldest) price for the asset
        db
          .selectFrom('asset_daily_prices')
          .where('asset_id', '=', asset.assetId)
          .orderBy('recorded_at', 'asc')
          .select('price')
          .limit(1)
          .executeTakeFirst(),
      ]);

      // Only proceed if we have both latest and initial prices
      if (latestPrice && initialPrice) {
        // Calculate the current value of the asset
        const assetValue = latestPrice.price * asset.quantity;
        // Calculate the initial cost of the asset
        const assetCost = initialPrice.price * asset.quantity;

        // Add to the running totals
        totalValue += assetValue;
        totalCost += assetCost;
      }
    }

    // Calculate the overall Profit and Loss (PnL)
    const pnl = totalValue - totalCost;

    // Calculate the PnL percentage
    // We use a ternary operator to avoid division by zero if totalCost is 0
    const pnlPercentage = totalCost !== 0 ? (pnl / totalCost) * 100 : 0;

    // Return the results, rounding to 2 decimal places for better readability
    return {
      totalValue: Number(totalValue.toFixed(2)),
      pnl: Number(pnl.toFixed(2)),
      pnlPercentage: Number(pnlPercentage.toFixed(2)),
    };
  }
}
