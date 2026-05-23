import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNotEmpty()
  account_id: string | number;

  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  expense_date: string;
}
