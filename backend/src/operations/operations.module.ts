import { Module } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { OperationsController } from './operations.controller';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OperationsController, ProductsController],
  providers: [OperationsService, ProductsService],
  exports: [OperationsService, ProductsService],
})
export class OperationsModule {}
