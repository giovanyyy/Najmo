import { Controller, Get, Post, Patch, Body, UseGuards, Request, Param, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// @ts-ignore
import { diskStorage } from 'multer';
import { extname } from 'path';
import { OperationsService } from './operations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '../auth/guards/permissions.guard';

@Controller('operations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('attachment', {
    storage: diskStorage({
      destination: './public/uploads/attachments',
      filename: (req: any, file: any, cb: any) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      }
    })
  }))
  @Permissions('operations.create')
  async create(@Body() data: any, @Request() req: any, @UploadedFile() file: any) {
    try {
      const userId = BigInt(req.user.id);
      const operationData = { ...data };
      
      if (file) {
        operationData.attachment_url = `/uploads/attachments/${file.filename}`;
      }

      return await this.operationsService.create(operationData, userId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/validate')
  @Permissions('operations.editCompleted')
  async validateOperation(@Param('id') id: string, @Request() req: any) {
    return this.operationsService.validateOperation(BigInt(id), BigInt(req.user.id));
  }

  @Post(':id/cancel')
  @Permissions('operations.cancel')
  async cancelOperation(@Param('id') id: string, @Request() req: any) {
    return this.operationsService.cancelOperation(BigInt(id), BigInt(req.user.id));
  }

  @Get()
  @Permissions('operations.view')
  async findAll() {
    return this.operationsService.findAll();
  }
  
  @Get(':id')
  @Permissions('operations.view')
  async findOne(@Param('id') id: string) {
    return this.operationsService.findOne(BigInt(id));
  }

  @Get('unbilled')
  @Permissions('invoices.create')
  async getUnbilledOperations() {
    return this.operationsService.getUnbilledOperations();
  }
}
