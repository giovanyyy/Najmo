import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('JWT AUTH FAILURE: No token provided');
      throw new UnauthorizedException('Token non fourni');
    }

    try {
      const secret = this.configService.get<string>('JWT_LOCAL_SECRET') || 'najmo-erp-super-secret-2024-local';
      const payload = await this.jwtService.verifyAsync(token, {
        secret: secret,
      });

      // Validate user from DB
      const user = await this.prisma.users.findUnique({
        where: { id: BigInt(payload.sub) },
      });

      if (!user) {
        this.logger.warn(`JWT AUTH FAILURE: User not found for id ${payload.sub}`);
        throw new UnauthorizedException('Utilisateur non trouvé');
      }

      if (!user.is_active) {
        this.logger.warn(`JWT AUTH FAILURE: User ${user.email} is inactive`);
        throw new UnauthorizedException('Votre compte a été désactivé');
      }

      // Attach user info to request
      request.user = {
        id: user.id.toString(),
        userId: user.id.toString(),
        email: user.email,
        roles: [user.role || 'EMPLOYEE'],
        forcePasswordChange: user.force_password_change,
      };

      return true;
    } catch (error) {
      this.logger.warn(`JWT AUTH FAILURE: ${error.message}`);
      throw new UnauthorizedException('Session expirée ou invalide');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
