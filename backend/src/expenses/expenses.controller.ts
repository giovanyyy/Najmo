import { Controller, Get, Post, Delete, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '../auth/guards/permissions.guard';

@Controller('expenses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExpensesController {
  constructor(private readonly service: ExpensesService) {}

  @Post()
  @Permissions('expenses.create')
  create(@Body() dto: CreateExpenseDto, @Request() req: any) {
    return this.service.create(dto, BigInt(req.user.id));
  }

  @Get()
  @Permissions('expenses.view')
  findAll(
    @Query('category') category?: string,
    @Query('account_id') accountId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.findAll({ category, account_id: accountId, startDate, endDate });
  }

  @Delete(':id')
  @Permissions('expenses.delete')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(BigInt(id), BigInt(req.user.id));
  }
}
