export class Asset {
  id: string;
  name: string;
  asset_type: 'ERC-20' | 'ERC-721';
  description?: string;
  contract_address: string;
  chain: string;
  token_id?: string;
  created_at: Date;
}
