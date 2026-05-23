import { IsString, IsEmail, IsEnum, MinLength } from 'class-validator';

export enum UserRole {
  EMPLOYE = 'EMPLOYÉ',
  COMPTABLE = 'COMPTABLE',
}

export class CreateUserDto {
  @IsString()
  username: string;

  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
