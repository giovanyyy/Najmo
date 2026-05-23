import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly service: ExchangeRatesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateExchangeRateDto, @Request() req: any) {
    const keycloakUserId = req.user?.userId;
    return this.service.create(dto, keycloakUserId);
  }

  @Get('latest')
  getLatestRates() {
    return this.service.getLatestRates();
  }

  @Get('history')
  getHistory() {
    return this.service.getHistory();
  }

  @Post('convert')
  convert(@Body() body: { from: string; to: string; amount: number }) {
    return this.service.convert(body.from, body.to, body.amount);
  }
}
