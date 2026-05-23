import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';

export class CreateTransferDto {
  @IsNotEmpty()
  source_account_id: string | number;

  @IsNotEmpty()
  destination_account_id: string | number;

  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  source_amount: number;

  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  destination_amount: number;

  @IsNumber()
  @IsOptional()
  exchange_rate?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsNotEmpty()
  transfer_date: string;
}
