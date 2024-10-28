import { ApiProperty } from '@nestjs/swagger';
import { PortfolioValueAndPnL } from '../interfaces/portfolio-value-and-pnl.interface';

export class PortfolioValueAndPnLDto implements PortfolioValueAndPnL {
  @ApiProperty({
    description: 'The total current value of the portfolio.',
    example: 10000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'The total Profit and Loss (PnL) of the portfolio.',
    example: 500,
  })
  pnl: number;

  @ApiProperty({
    description:
      'The percentage of Profit and Loss (PnL) relative to the initial investment.',
    example: 5,
  })
  pnlPercentage: number;
}
