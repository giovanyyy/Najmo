import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { LocalAuthService } from './local-auth.service';
import { LocalAuthController } from './local-auth.controller';

@Global()
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_LOCAL_SECRET') || 'najmo-erp-super-secret-2024-local',
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [LocalAuthService],
  controllers: [LocalAuthController],
  exports: [LocalAuthService, JwtModule],
})
export class AuthModule {}

