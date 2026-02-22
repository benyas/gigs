import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { StripSecretsInterceptor } from './common/interceptors/strip-secrets.interceptor';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  // Fail fast if JWT_SECRET is missing or default in production
  if (isProduction) {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'dev-secret-change-me') {
      throw new Error('FATAL: JWT_SECRET must be set to a secure value in production');
    }
  }

  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: [
      process.env.WEB_URL || 'http://localhost:3000',
      process.env.ADMIN_URL || 'http://localhost:3003',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new StripSecretsInterceptor());

  const port = process.env.API_PORT || 4000;
  await app.listen(port);
  Logger.log(`API running on http://localhost:${port}`, 'Bootstrap');
}

bootstrap();
