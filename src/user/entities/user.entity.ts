import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty({ description: 'The unique identifier of the user' })
  id: string;

  @ApiProperty({ description: 'The Privy ID associated with the user' })
  privy_id: string;

  @ApiProperty({ description: 'The date and time when the user was created' })
  created_at: Date;

  @ApiProperty({
    description: 'The date and time when the user was last updated',
  })
  updated_at: Date;
}
