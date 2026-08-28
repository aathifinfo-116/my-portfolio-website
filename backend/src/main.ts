import { Logger, ValidationPipe } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { NestFactory } from '@nestjs/core';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {

 const app = await NestFactory.create(AppModule, {

 bufferLogs: true,

 });

 const config = app.get(ConfigService);

 const logger = new Logger('Bootstrap');

 /*

 * Vercel provides PORT automatically.

 * Locally, the application falls back to app.port and then 4000.

 */

 const port =

 Number(process.env.PORT) ||

 config.get<number>('app.port') ||

 4000;

 const apiPrefix =

 config.get<string>('app.apiPrefix') || 'api';

 const isProduction =

 (process.env.NODE_ENV ||

 config.get<string>('app.env')) === 'production';

 /*

 * Recommended Vercel variable:

 * FRONTEND_URL=https://your-frontend.vercel.app

 *

 * Multiple origins can be comma-separated.

 */

 const configuredOrigins =

 process.env.FRONTEND_URL ||

 config.get<string>('app.corsOrigins') ||

 '';

 const corsOrigins = Array.isArray(configuredOrigins)

 ? configuredOrigins

 : configuredOrigins

 .split(',')

 .map((origin) => origin.trim())

 .filter(Boolean);

 app.setGlobalPrefix(apiPrefix);

 app.use(

 helmet({

 crossOriginResourcePolicy: {

 policy: 'cross-origin',

 },

 contentSecurityPolicy: {

 useDefaults: true,

 directives: {

 frameAncestors: ["'self'", ...corsOrigins],

 },

 },

 frameguard: false,

 }),

 );

 app.enableCors({

 origin: (origin, callback) => {

 /*

 * Requests without an Origin include server-to-server calls,

 * health checks, Swagger tools, and local API clients.

 */

 if (!origin) {

 callback(null, true);

 return;

 }

 if (!isProduction && corsOrigins.length === 0) {

 callback(null, true);

 return;

 }

 if (corsOrigins.includes(origin)) {

 callback(null, true);

 return;

 }

 callback(new Error(`CORS blocked origin: ${origin}`), false);

 },

 methods: [

 'GET',

 'POST',

 'PUT',

 'PATCH',

 'DELETE',

 'OPTIONS',

 ],

 allowedHeaders: [

 'Content-Type',

 'Authorization',

 'Accept',

 ],

 credentials: true,

 });

 app.useGlobalPipes(

 new ValidationPipe({

 whitelist: true,

 forbidNonWhitelisted: true,

 transform: true,

 transformOptions: {

 enableImplicitConversion: false,

 },

 }),

 );

 const expressApp = app.getHttpAdapter().getInstance();

 expressApp.set('trust proxy', 1);

 /*

 * Swagger is disabled in production.

 * Set ENABLE_SWAGGER=true in Vercel if production docs are needed.

 */

 const enableSwagger =

 !isProduction ||

 process.env.ENABLE_SWAGGER === 'true';

 if (enableSwagger) {

 const swaggerConfig = new DocumentBuilder()

 .setTitle('Portfolio API')

 .setDescription(

 'Backend API for the Aathif Thahir portfolio site',

 )

 .setVersion('1.0')

 .addBearerAuth()

 .build();

 const document = SwaggerModule.createDocument(

 app,

 swaggerConfig,

 );

 SwaggerModule.setup(

 `${apiPrefix}/docs`,

 app,

 document,

 );

 }

 app.enableShutdownHooks();

 await app.listen(port);

 logger.log(`API ready on port ${port}/${apiPrefix}`);

 if (enableSwagger) {

 logger.log(

 `Swagger docs available at /${apiPrefix}/docs`,

 );

 }

}

void bootstrap();
