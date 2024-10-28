/**
 * Represents the calculated portfolio value and Profit and Loss (PnL) information.
 */
export interface PortfolioValueAndPnL {
  /**
   * The total current value of the portfolio.
   */
  totalValue: number;

  /**
   * The total Profit and Loss (PnL) of the portfolio.
   * Positive values indicate profit, negative values indicate loss.
   */
  pnl: number;

  /**
   * The percentage of Profit and Loss (PnL) relative to the initial investment.
   * Expressed as a percentage where positive values indicate profit and negative values indicate loss.
   */
  pnlPercentage: number;
}
