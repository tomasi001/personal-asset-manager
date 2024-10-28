// src/database/types.ts
import {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely';

export interface Database {
  users: UserTable;
  assets: AssetTable;
  user_assets: UserAssetTable;
  asset_daily_prices: AssetDailyPriceTable;
}

// Define the UserTable interface
export interface UserTable {
  id: Generated<string>;
  privy_id: string;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, never>;
}

// Define the AssetTable interface
export interface AssetTable {
  id: Generated<string>; // UUID Primary Key
  name: string; // Asset name (e.g., "USDC", "CryptoPunk #123")
  asset_type: 'ERC-20' | 'ERC-721'; // Distinguishes between ERC-20 and ERC-721
  description?: string; // Optional description of the asset
  contract_address: string; // Smart contract address (42 chars)
  chain: string; // Blockchain network (e.g., "Ethereum")
  token_id?: string; // Token ID for ERC-721 assets (optional)
  created_at: ColumnType<Date, string | undefined, never>; // Timestamp of asset creation
}

// Define the UserAssetTable interface
export interface UserAssetTable {
  id: Generated<string>; // UUID Primary Key
  user_id: string; // Foreign Key to users table
  asset_id: string; // Foreign Key to assets table
  quantity?: number; // Quantity for ERC-20 tokens, defaults to 1 for ERC-721
  created_at: ColumnType<Date, string | undefined, never>; // Timestamp of relationship creation
}

// Define the AssetDailyPriceTable interface
export interface AssetDailyPriceTable {
  id: Generated<string>; // UUID Primary Key
  asset_id: string; // Foreign Key to assets table
  price: number; // Asset price in USD (Numeric 20,6)
  recorded_at: ColumnType<Date, string | undefined, never>; // Date of price recording
}

// Define types for each table
export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export type Asset = Selectable<AssetTable>;
export type NewAsset = Insertable<AssetTable>;
export type AssetUpdate = Updateable<AssetTable>;

export type UserAsset = Selectable<UserAssetTable>;
export type NewUserAsset = Insertable<UserAssetTable>;
export type UserAssetUpdate = Updateable<UserAssetTable>;

export type AssetDailyPrice = Selectable<AssetDailyPriceTable>;
export type NewAssetDailyPrice = Insertable<AssetDailyPriceTable>;
export type AssetDailyPriceUpdate = Updateable<AssetDailyPriceTable>;
