import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminSignInDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Admin1', description: 'Admin username' })
  username: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Admin123!', description: 'Admin password' })
  password: string;
}
