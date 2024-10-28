import { ApiProperty } from '@nestjs/swagger';
import { AssetHistoryEntryEntity } from '../entities/asset-history-entry.entity';
import { AssetType } from '../enums/ asset-type.enum';
import {
  AssetHistory,
  AssetHistoryEntry,
  MergedUserAsset,
} from '../interfaces/asset-interfaces';

export class MergedUserAssetResponse implements MergedUserAsset {
  @ApiProperty()
  id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty()
  asset_id: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: AssetType })
  asset_type: AssetType;

  @ApiProperty()
  description: string;

  @ApiProperty()
  contract_address: string;

  @ApiProperty()
  chain: string;

  @ApiProperty({ nullable: true })
  token_id: string | null;

  @ApiProperty()
  asset_created_at: Date;
}

export class AssetHistoryResponse implements AssetHistory {
  @ApiProperty({ type: [AssetHistoryEntryEntity] })
  history: AssetHistoryEntry[];

  @ApiProperty()
  quantity: string;

  @ApiProperty()
  overallPnl: number;

  @ApiProperty()
  overallPnlPercentage: number;
}
