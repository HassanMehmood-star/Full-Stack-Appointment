import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(7, { message: 'Password must be at least 7 characters' })
  password: string;

  @IsEnum(Role, { message: 'Role must be PATIENT, DOCTOR, or ADMIN' })
  role: Role;
}
