import { AssetType } from '../enums/ asset-type.enum';
// Add this to your existing types.ts file or create a new file for it

export interface AssetHistoryEntry {
  date: string;
  price: string;
  value: number;
  dailyPnl: number;
  cumulativePnl: number;
  cumulativePnlPercentage: number;
}

export interface AssetHistory {
  history: AssetHistoryEntry[];
  quantity: string;
  overallPnl: number;
  overallPnlPercentage: number;
}

export interface Asset {
  id: string;
  name: string;
  asset_type: AssetType;
  description: string;
  contract_address: string;
  chain: string;
  token_id: string | null;
  created_at: Date;
}

export interface UserAsset {
  id: string;
  user_id: string;
  asset_id: string;
  quantity: number;
  created_at: Date;
}

export interface MergedUserAsset extends UserAsset {
  name: string;
  asset_type: AssetType;
  description: string;
  contract_address: string;
  chain: string;
  token_id: string | null;
  asset_created_at: Date;
}
