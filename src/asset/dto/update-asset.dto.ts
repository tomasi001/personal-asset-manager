import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';

export class UpdateAssetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['ERC-20', 'ERC-721'])
  asset_type?: 'ERC-20' | 'ERC-721';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  contract_address?: string;

  @IsOptional()
  @IsEnum(['Ethereum', 'Polygon', 'Arbitrum'])
  chain?: string;

  @IsOptional()
  @IsString()
  token_id?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;
}
