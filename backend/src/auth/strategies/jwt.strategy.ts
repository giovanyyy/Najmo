import { Injectable, UnauthorizedException } from '@nestjs/common';
const { PassportStrategy } = require('@nestjs/passport');
// @ts-ignore
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_LOCAL_SECRET') || 'najmo-erp-super-secret-2024-local',
    });
  }

  async validate(payload: any) {
    try {
      // Local check against active user
      const user = await this.prisma.users.findUnique({
        where: { id: BigInt(payload.sub) },
      });

      if (!user) {
        throw new UnauthorizedException('Utilisateur non trouvé');
      }

      if (!user.is_active) {
        throw new UnauthorizedException('Votre compte a été désactivé');
      }

      return {
        id: user.id.toString(),
        userId: user.id.toString(),
        email: user.email,
        roles: [user.role], // Standardized on singular role field inside users table, mapped to roles array
        forcePasswordChange: user.force_password_change,
      };
    } catch (error) {
      console.error('[JWT ERROR] Validation failed:', error);
      return null;
    }
  }
}
