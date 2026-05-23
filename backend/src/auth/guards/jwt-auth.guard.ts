import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: any) {
    if (err || !user) {
      const logFile = path.join(__dirname, '..', '..', '..', 'request-logs.txt');
      const authLog = `[${new Date().toISOString()}] JWT AUTH FAILURE:\n` +
                      `Error: ${JSON.stringify(err)}\n` +
                      `User: ${JSON.stringify(user)}\n` +
                      `Info Name: ${info?.name}\n` +
                      `Info Message: ${info?.message}\n` +
                      `Info Stack: ${info?.stack || info}\n` +
                      `----------------------------------------\n\n`;
      fs.appendFileSync(logFile, authLog);
      throw err || new UnauthorizedException(info?.message || 'Unauthorized');
    }
    return user;
  }
}
