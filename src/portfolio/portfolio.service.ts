import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AssetService } from '../assets/assets.service';
import { PortfolioValueAndPnL } from './interfaces/portfolio-value-and-pnl.interface';
import { MergedUserAsset } from '../assets/interfaces/asset-interfaces';
import { Database } from '../database/types';
import { Kysely } from 'kysely';

/**
 * PortfolioService is responsible for managing and calculating portfolio-related data.
 * It uses DatabaseService for database operations and AssetService for asset-related operations.
 */
@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);

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
  async getPortfolioValueAndPnL(userId: string): Promise<PortfolioValueAndPnL> {
    try {
      const assets = await this.assetService.findAll(userId);

      if (assets.length === 0) {
        return this.getDefaultPortfolioValues();
      }

      const db = this.databaseService.getDb();
      const assetValues = await Promise.all(
        assets.map((asset) => this.calculateAssetValue(db, asset)),
      );

      const { totalValue, totalCost } = this.sumAssetValues(assetValues);
      const pnl = totalValue - totalCost;
      const pnlPercentage = this.calculatePnLPercentage(pnl, totalCost);

      return this.formatPortfolioResults(totalValue, pnl, pnlPercentage);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Error calculating portfolio value: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          'An unexpected error occurred while calculating portfolio value',
          String(error),
        );
      }
      throw error;
    }
  }

  private getDefaultPortfolioValues(): PortfolioValueAndPnL {
    return { totalValue: 0, pnl: 0, pnlPercentage: 0 };
  }

  private async calculateAssetValue(
    db: Kysely<Database>,
    asset: MergedUserAsset,
  ): Promise<{ value: number; cost: number }> {
    const [latestPrice, initialPrice] = await Promise.all([
      this.getLatestAssetPrice(db, asset.asset_id),
      this.getInitialAssetPrice(db, asset.asset_id),
    ]);

    if (!latestPrice || !initialPrice) {
      this.logger.warn(`Missing price data for asset ${asset.asset_id}`);
      return { value: 0, cost: 0 };
    }

    return {
      value: latestPrice.price * asset.quantity,
      cost: initialPrice.price * asset.quantity,
    };
  }

  private async getLatestAssetPrice(db: Kysely<Database>, assetId: string) {
    return db
      .selectFrom('asset_daily_prices')
      .where('asset_id', '=', assetId)
      .orderBy('recorded_at', 'desc')
      .select('price')
      .limit(1)
      .executeTakeFirst();
  }

  private async getInitialAssetPrice(db: Kysely<Database>, assetId: string) {
    return db
      .selectFrom('asset_daily_prices')
      .where('asset_id', '=', assetId)
      .orderBy('recorded_at', 'asc')
      .select('price')
      .limit(1)
      .executeTakeFirst();
  }

  private sumAssetValues(assetValues: { value: number; cost: number }[]): {
    totalValue: number;
    totalCost: number;
  } {
    return assetValues.reduce(
      (acc, curr) => ({
        totalValue: acc.totalValue + curr.value,
        totalCost: acc.totalCost + curr.cost,
      }),
      { totalValue: 0, totalCost: 0 },
    );
  }

  private calculatePnLPercentage(pnl: number, totalCost: number): number {
    return totalCost !== 0 ? (pnl / totalCost) * 100 : 0;
  }

  private formatPortfolioResults(
    totalValue: number,
    pnl: number,
    pnlPercentage: number,
  ): PortfolioValueAndPnL {
    return {
      totalValue: Number(totalValue.toFixed(2)),
      pnl: Number(pnl.toFixed(2)),
      pnlPercentage: Number(pnlPercentage.toFixed(2)),
    };
  }
}
