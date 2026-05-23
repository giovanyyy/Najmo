import { IsEnum, IsNumber, IsNotEmpty } from 'class-validator';

export enum Currency {
  DZD = 'DZD',
  USD = 'USD',
  EUR = 'EUR',
  USDT = 'USDT',
}

export class CreateExchangeRateDto {
  @IsEnum(Currency)
  @IsNotEmpty()
  base_currency: Currency;

  @IsEnum(Currency)
  @IsNotEmpty()
  target_currency: Currency;

  @IsNumber()
  @IsNotEmpty()
  rate: number;
}
