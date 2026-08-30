import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

/**
 * Builds and configures the Nest application without starting a listener.
 *
 * Shared by the local dev entry point (src/main.ts, which calls listen) and
 * the Vercel serverless handler (api/index.ts, which hands the underlying
 * Express instance to the platform). Keeping configuration in one place stops
 * the two environments from drifting apart.
 */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  const apiPrefix = config.get<string>('app.apiPrefix', 'api');
  const corsOrigins = config.get<string[]>('app.corsOrigins', []);

  // Applies to controllers only; ServeStaticModule keeps serving /static
  // from the root, which is where upload URLs point.
  app.setGlobalPrefix(apiPrefix);

  app.use(
    helmet({
      // Lets the frontend embed images and PDFs served from this origin.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          // The document viewer embeds static PDFs in an <iframe>. Default
          // helmet sends frame-ancestors 'self', which blocks that whenever
          // the frontend is on a different origin.
          frameAncestors: ["'self'", ...corsOrigins],
        },
      },
      // X-Frame-Options has no origin list, so it would still block
      // cross-origin framing. CSP frame-ancestors above supersedes it.
      frameguard: false,
    }),
  );

  app.enableCors({
    // An empty list would mean "reflect any origin"; fail closed instead.
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

  // Trust the platform proxy so req.ip is the real client IP, which the
  // contact-form and login rate limits depend on.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Swagger assets come from a CDN: the bundled static files are not
  // reliably present in a serverless deployment.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Portfolio API')
    .setDescription('Backend API for the Aathif Thahir portfolio site')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup(
    `${apiPrefix}/docs`,
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
    {
      customCssUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
      customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
      ],
    },
  );

  return app;
}
