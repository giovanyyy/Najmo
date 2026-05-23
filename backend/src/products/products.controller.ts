import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '../auth/guards/permissions.guard';

@Controller('products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Permissions('products.create')
  create(@Body() createProductDto: any, @Request() req: any) {
    return this.productsService.create(createProductDto, BigInt(req.user.id));
  }

  @Get()
  @Permissions('products.view')
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @Permissions('products.view')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(BigInt(id));
  }

  @Patch(':id')
  @Permissions('products.edit')
  update(@Param('id') id: string, @Body() updateProductDto: any, @Request() req: any) {
    return this.productsService.update(BigInt(id), updateProductDto, BigInt(req.user.id));
  }

  @Delete(':id')
  @Permissions('products.delete')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.productsService.remove(BigInt(id), BigInt(req.user.id));
  }
}
