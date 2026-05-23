import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '../auth/guards/permissions.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Permissions('clients.create')
  create(@Body() createClientDto: any, @Request() req: any) {
    return this.clientsService.create(createClientDto, BigInt(req.user.id));
  }

  @Get()
  @Permissions('clients.viewHistory')
  findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  @Permissions('clients.viewHistory')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(BigInt(id));
  }

  @Patch(':id')
  @Permissions('clients.edit')
  update(@Param('id') id: string, @Body() updateClientDto: any, @Request() req: any) {
    return this.clientsService.update(BigInt(id), updateClientDto, BigInt(req.user.id));
  }

  @Delete(':id')
  @Permissions('clients.delete')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.clientsService.remove(BigInt(id), BigInt(req.user.id));
  }
}
