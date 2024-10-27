import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssetDto {
  @ApiProperty({ description: 'The name of the asset' })
  @IsString()
  name: string;

  @ApiProperty({
    enum: ['ERC-20', 'ERC-721'],
    description: 'The type of the asset',
  })
  @IsEnum(['ERC-20', 'ERC-721'])
  asset_type: 'ERC-20' | 'ERC-721';

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
