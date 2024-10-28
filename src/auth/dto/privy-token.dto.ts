import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PrivyTokenDto {
  @ApiProperty({
    description: 'The token issued by Privy.io that needs to be validated',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  @IsString()
  privyToken: string;
}
