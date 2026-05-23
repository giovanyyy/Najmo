import { Module } from '@nestjs/common';
import { InternalTransfersService } from './internal-transfers.service';
import { InternalTransfersController } from './internal-transfers.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InternalTransfersController],
  providers: [InternalTransfersService],
  exports: [InternalTransfersService]
})
export class InternalTransfersModule {}
