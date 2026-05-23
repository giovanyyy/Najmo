import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { LocalAuthService } from './local-auth.service';
import { LocalAuthController } from './local-auth.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
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
  providers: [JwtStrategy, LocalAuthService],
  controllers: [LocalAuthController],
  exports: [PassportModule, JwtStrategy, LocalAuthService],
})
export class AuthModule {}

