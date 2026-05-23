import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';

export enum ClientType {
  NORMAL = 'NORMAL',
  VIP = 'VIP',
  RISK = 'RISK',
}

export class CreateClientDto {
  @IsString()
  full_name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEnum(ClientType)
  @IsOptional()
  client_type?: ClientType;

  @IsString()
  @IsOptional()
  notes?: string;
}
