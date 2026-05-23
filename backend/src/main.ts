import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Request & Response Logging Middleware
  app.use((req: any, res: any, next: any) => {
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(__dirname, '..', 'request-logs.txt');
    
    // Log incoming request details (excluding sensitive credentials like password)
    const sanitizedBody = req.body ? { ...req.body } : {};
    if (sanitizedBody.password) sanitizedBody.password = '******';
    
    const reqLog = `[${new Date().toISOString()}] REQUEST: ${req.method} ${req.url}\n` +
                   `Headers: ${JSON.stringify(req.headers)}\n` +
                   `Body: ${JSON.stringify(sanitizedBody)}\n`;
    fs.appendFileSync(logFile, reqLog);

    const originalSend = res.send;
    res.send = function(body: any) {
      const respLog = `[${new Date().toISOString()}] RESPONSE: ${res.statusCode}\n` +
                      `Body: ${body}\n` +
                      `----------------------------------------\n\n`;
      fs.appendFileSync(logFile, respLog);
      return originalSend.apply(this, arguments);
    };
    next();
  });
  
  app.useGlobalInterceptors(new BigIntInterceptor());
  app.setGlobalPrefix('api/v1');
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001;

  // Security
  app.use(helmet());
  app.enableCors({
    origin: true, // In production, specify your frontend URL
    credentials: true,
  });

  // Global Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(port);
  console.log(`🚀 NAJMO ERP Backend running on: http://localhost:${port}`);
}
bootstrap();
