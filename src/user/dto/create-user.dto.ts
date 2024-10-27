import { IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  privy_id: string;
}
