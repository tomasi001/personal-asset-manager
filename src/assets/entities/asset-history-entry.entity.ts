import { ApiProperty } from '@nestjs/swagger';
import { AssetHistoryEntry } from '../interfaces/asset-interfaces';

export class AssetHistoryEntryEntity implements AssetHistoryEntry {
  @ApiProperty({ description: 'The date of the history entry' })
  date: string;

  @ApiProperty({ description: 'The price of the asset at this date' })
  price: string;

  @ApiProperty({ description: 'The value of the asset at this date' })
  value: number;

  @ApiProperty({ description: 'The daily profit and loss' })
  dailyPnl: number;

  @ApiProperty({ description: 'The cumulative profit and loss' })
  cumulativePnl: number;

  @ApiProperty({ description: 'The cumulative profit and loss percentage' })
  cumulativePnlPercentage: number;
}
