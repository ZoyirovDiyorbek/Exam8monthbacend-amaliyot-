import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TeacherSignInDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'adham011905@gmail.com', description: 'Teacher email' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Password123!', description: 'Teacher password' })
  password: string;
}
