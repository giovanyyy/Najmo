import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { InternalTransfersService } from './internal-transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '../auth/guards/permissions.guard';

@Controller('internal-transfers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InternalTransfersController {
  constructor(private readonly service: InternalTransfersService) {}

  @Post()
  @Permissions('transfers.create')
  create(@Body() dto: CreateTransferDto, @Request() req: any) {
    return this.service.create(dto, BigInt(req.user.id));
  }

  @Get()
  @Permissions('transfers.view')
  findAll() {
    return this.service.findAll();
  }

  @Delete(':id')
  @Permissions('transfers.delete')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(BigInt(id), BigInt(req.user.id));
  }
}
