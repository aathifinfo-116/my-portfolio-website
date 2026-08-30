import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

/**
 * Matches a request Origin against the configured allow-list.
 *
 * Entries may contain `*`, which matches within one label only:
 * `https://my-app-*.vercel.app` allows every preview deployment of that
 * project but not `https://evil.vercel.app`. Vercel mints a new subdomain per
 * deployment, so an exact-match-only list goes stale constantly.
 */
function isAllowedOrigin(origin: string, allowList: string[]): boolean {
  return allowList.some((entry) => {
    if (!entry.includes('*')) return entry === origin;

    const pattern = entry
      .split('*')
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('[^.]*');

    return new RegExp(`^${pattern}$`).test(origin);
  });
}

/**
 * Builds and configures the Nest application without starting a listener.
 *
 * Shared by the local dev entry point (src/main.ts, which calls listen) and
 * the Vercel serverless handler (api/index.ts, which hands the underlying
 * Express instance to the platform), so the two cannot drift apart.
 */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  const apiPrefix = config.get<string>('app.apiPrefix', 'api');

  // Tolerate CORS_ORIGINS arriving as an array or a comma-separated string.
  const rawCors = config.get<string | string[]>('app.corsOrigins', []);
  const corsOrigins = (
    typeof rawCors === 'string' ? rawCors.split(',') : rawCors
  )
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.setGlobalPrefix(apiPrefix);

  app.use(
    helmet({
      // Lets the frontend embed images and PDFs served from this origin.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          // The document viewer embeds PDFs in an <iframe>. Helmet's default
          // frame-ancestors 'self' blocks that from another origin.
          frameAncestors: ["'self'", ...corsOrigins],
        },
      },
      // X-Frame-Options has no origin list and would still block framing.
      frameguard: false,
    }),
  );

  app.enableCors({
    // An empty list would mean "reflect any origin"; fail closed instead.
    origin:
      corsOrigins.length > 0
        ? (
            origin: string | undefined,
            callback: (err: Error | null, allow?: boolean) => void,
          ) => {
            // No Origin header at all: curl, server-to-server, same-origin
            // navigation. CORS does not apply, so let it through.
            if (!origin) return callback(null, true);
            callback(null, isAllowedOrigin(origin, corsOrigins));
          }
        : false,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
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
