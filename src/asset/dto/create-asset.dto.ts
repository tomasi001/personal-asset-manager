import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';

export class CreateAssetDto {
  @IsString()
  name: string;

  @IsEnum(['ERC-20', 'ERC-721'])
  asset_type: 'ERC-20' | 'ERC-721';

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  contract_address: string;

  @IsEnum(['Ethereum', 'Polygon', 'Arbitrum'])
  chain: string;

  @IsOptional()
  @IsString()
  token_id?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;
}
