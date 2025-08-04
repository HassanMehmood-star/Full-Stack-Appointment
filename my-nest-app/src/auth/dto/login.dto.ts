import { IsEmail, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @MinLength(7, { message: 'Password must be at least 7 characters' })
  password: string;
}
