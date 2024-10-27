import { ApiProperty } from '@nestjs/swagger';

export class Asset {
  @ApiProperty({ description: 'The unique identifier of the asset' })
  id: string;

  @ApiProperty({ description: 'The name of the asset' })
  name: string;

  @ApiProperty({
    description: 'The type of the asset',
    enum: ['ERC-20', 'ERC-721'],
  })
  asset_type: 'ERC-20' | 'ERC-721';

  @ApiProperty({ description: 'A description of the asset', required: false })
  description?: string;

  @ApiProperty({ description: 'The contract address of the asset' })
  contract_address: string;

  @ApiProperty({ description: 'The blockchain network of the asset' })
  chain: string;

  @ApiProperty({
    description: 'The token ID for ERC-721 assets',
    required: false,
  })
  token_id?: string;

  @ApiProperty({ description: 'The date and time when the asset was created' })
  created_at: Date;
}
