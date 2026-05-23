import { Controller, Get, Post, Body, UseGuards, Headers, Delete, Param, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('Administrateur', 'ADMIN')
  createUser(
    @Body() createUserDto: CreateUserDto,
    @Headers('authorization') authHeader: string,
  ) {
    const accessToken = authHeader?.replace('Bearer ', '') || '';
    return this.usersService.createUser(createUserDto, accessToken);
  }

  @Get()
  @Roles('Administrateur', 'ADMIN')
  findAll() {
    return this.usersService.findAll();
  }

  @Delete(':id')
  @Roles('Administrateur', 'ADMIN')
  deleteUser(@Param('id') id: string, @Request() req: any) {
    const adminId = req.user?.id;
    return this.usersService.deleteUser(id, adminId);
  }
}

