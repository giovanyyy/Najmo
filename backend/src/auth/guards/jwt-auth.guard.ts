import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest(err: any, user: any, info: any, context: any) {
    if (err || !user) {
      this.logger.warn(`JWT AUTH FAILURE: ${info?.name} - ${info?.message}`);
      throw err || new UnauthorizedException(info?.message || 'Unauthorized');
    }
    return user;
  }
}
