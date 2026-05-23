import { Controller, Get, Param, Patch, Body, Post, Logger } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {
    this.logger.log('🚀 ProductsController initialized with PATCH /:id and PATCH /:id/status');
  }

  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  @Get('active')
  async findActive() {
    return this.productsService.findActive();
  }

  @Get(':id/compatibility')
  async getCompatibility(@Param('id') id: string) {
    return this.productsService.getCompatibility(id);
  }

  @Post()
  async create(@Body() data: any) {
    this.logger.log(`Creating product: ${data.name}`);
    return this.productsService.create(data);
  }

  @Patch(':id/status')
  async toggleStatus(@Param('id') id: string, @Body() body: any) {
    this.logger.log(`Toggling status for product ${id}: ${body.is_active}`);
    return this.productsService.toggleStatus(id, body.is_active);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    this.logger.log(`Updating product ${id}`);
    return this.productsService.update(id, data);
  }
}
