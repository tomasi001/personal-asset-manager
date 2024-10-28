export interface MergedUserAsset {
  quantity: number;
  created_at: Date;
  name: string;
  asset_type: 'ERC-20' | 'ERC-721';
  description: string;
  contract_address: string;
  chain: string;
  token_id: string;
  userAssetId: string;
  assetId: string;
}
