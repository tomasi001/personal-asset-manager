import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { AssetType } from '../enums/ asset-type.enum';

export class CreateAssetDto {
  @ApiProperty({ description: 'The name of the asset' })
  @IsString()
  name: string;

  @ApiProperty({
    enum: AssetType,
    description: 'The type of the asset',
  })
  @IsEnum(AssetType)
  asset_type: AssetType;

  @ApiPropertyOptional({ description: 'A description of the asset' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'The contract address of the asset' })
  @IsString()
  contract_address: string;

  @ApiProperty({
    enum: ['Ethereum', 'Polygon', 'Arbitrum'],
    description: 'The blockchain network of the asset',
  })
  @IsEnum(['Ethereum', 'Polygon', 'Arbitrum'])
  chain: string;

  @ApiPropertyOptional({ description: 'The token ID for ERC-721 assets' })
  @IsOptional()
  @IsString()
  token_id?: string;

  @ApiPropertyOptional({
    description: 'The quantity of the asset (for ERC-20 tokens)',
  })
  @IsOptional()
  @IsNumber()
  quantity?: number;
}
