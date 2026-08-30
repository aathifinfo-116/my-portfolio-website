import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const port = config.get<number>('app.port', 4000);
  const apiPrefix = config.get<string>('app.apiPrefix', 'api');
  const corsOrigins = config.get<string[]>('app.corsOrigins', []);
  const isProduction = config.get<string>('app.env') === 'production';

  // Applies to controllers only; ServeStaticModule keeps serving /static
  // from the root, which is where upload URLs point.
  app.setGlobalPrefix(apiPrefix);

  app.use(
    helmet({
      // Allow the React dev server to embed images/PDFs served from here.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          // The document viewer embeds static PDFs in an <iframe>. Default
          // helmet sends frame-ancestors 'self', which blocks that whenever
          // the frontend is on a different origin (e.g. the Vite dev server).
          // Allow exactly the origins already trusted for CORS.
          frameAncestors: ["'self'", ...corsOrigins],
        },
      },
      // X-Frame-Options is the legacy equivalent and has no origin list, so
      // it would still block cross-origin framing. CSP frame-ancestors above
      // supersedes it in every browser that matters.
      frameguard: false,
    }),
  );

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties with no matching DTO field
      forbidNonWhitelisted: true, // 400 on unexpected fields
      transform: true, // apply @Type() conversions
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Trust the reverse proxy so req.ip is the real client IP behind Nginx.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Portfolio API')
      .setDescription('Backend API for the Aathif Thahir portfolio site')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`API ready on http://localhost:${port}/${apiPrefix}`);
  if (!isProduction) {
    logger.log(`Swagger docs on http://localhost:${port}/${apiPrefix}/docs`);
  }
}

void bootstrap();
