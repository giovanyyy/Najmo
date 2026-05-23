import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '../auth/guards/permissions.guard';

@Controller('accounts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @Permissions('accounts.create')
  create(@Body() createAccountDto: any, @Request() req: any) {
    return this.accountsService.create(createAccountDto, BigInt(req.user.id));
  }

  @Get()
  @Permissions('accounts.viewBalances')
  findAll() {
    return this.accountsService.findAll();
  }

  @Get('compatible')
  @Permissions('operations.create', 'operations.editDraft')
  findCompatible(
    @Query('productId') productId: string,
    @Query('type') type: 'SOURCE' | 'DESTINATION'
  ) {
    if (!productId || !type) {
      return [];
    }
    return this.accountsService.findCompatibleAccounts(BigInt(productId), type);
  }

  @Get(':id')
  @Permissions('accounts.viewBalances')
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(BigInt(id));
  }

  @Patch(':id')
  @Permissions('accounts.edit')
  update(@Param('id') id: string, @Body() updateAccountDto: any, @Request() req: any) {
    return this.accountsService.update(BigInt(id), updateAccountDto, BigInt(req.user.id));
  }

  @Delete(':id')
  @Permissions('accounts.delete')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.accountsService.remove(BigInt(id), BigInt(req.user.id));
  }
}
