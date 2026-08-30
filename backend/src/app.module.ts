import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { extname, join } from 'path';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { AwardsModule } from './modules/awards/awards.module';
import { CertificationsModule } from './modules/certifications/certifications.module';
import { ContactModule } from './modules/contact/contact.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SeedModule } from './modules/seed/seed.module';
import { ServicesModule } from './modules/services/services.module';
import { UploadsModule } from './modules/uploads/uploads.module';

/** Content types pinned for static assets. */
const STATIC_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: true },
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('database.url');
        const useSsl = config.get<boolean>('database.ssl', false);
        const poolSize = config.get<number>('database.poolSize', 10);

        return {
          type: 'postgres' as const,
          // A connection string wins when present; otherwise assemble from
          // the discrete DB_* fields.
          ...(url
            ? { url }
            : {
                host: config.getOrThrow<string>('database.host'),
                port: config.getOrThrow<number>('database.port'),
                username: config.getOrThrow<string>('database.username'),
                password: config.getOrThrow<string>('database.password'),
                database: config.getOrThrow<string>('database.database'),
              }),
          autoLoadEntities: true,
          // Convenient in development; production should run migrations.
          synchronize: config.get<boolean>('database.synchronize', false),
          logging: config.get<boolean>('database.logging', false),
          // Managed providers terminate TLS with their own CA chain. Forcing
          // it on unconditionally breaks a plain local Postgres.
          ssl: useSsl ? { rejectUnauthorized: false } : false,
          extra: {
            // Serverless runs many short-lived instances, so each must hold a
            // tiny pool or the provider's connection cap is hit immediately.
            max: poolSize,
            // Reap idle sockets quickly — a frozen Lambda holds them open.
            idleTimeoutMillis: 10_000,
            connectionTimeoutMillis: 10_000,
            ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
          },
          // Reconnect rather than dying when a pooled socket is cut.
          retryAttempts: 3,
          retryDelay: 1_000,
          keepConnectionAlive: true,
        };
      },
    }),

    /**
     * Serves uploaded PDFs and images at /static/**.
     *
     * Skipped on Vercel: the function filesystem is read-only and ephemeral,
     * uploads/ is gitignored so nothing deploys there, and `fallthrough:
     * false` would turn every such request into an ENOENT error rather than a
     * clean 404.
     */
    ...(process.env.VERCEL ? [] : [ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          rootPath: join(
            process.cwd(),
            config.get<string>('storage.uploadDir', './uploads').replace('./', ''),
          ),
          serveRoot: '/static',
          serveStaticOptions: {
            index: false,
            fallthrough: false,
            // Express infers most types correctly, but pinning the office and
            // PDF types keeps a misconfigured system mime database from
            // serving them as application/octet-stream.
            setHeaders: (res, filePath) => {
              const explicit = STATIC_MIME[extname(filePath).toLowerCase()];
              if (explicit) res.setHeader('Content-Type', explicit);
              res.setHeader('Accept-Ranges', 'bytes');
            },
          },
        },
      ],
    })]),

    // Baseline rate limit; login and contact tighten this with @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),

    AuthModule,
    ProfileModule,
    ServicesModule,
    ProjectsModule,
    CertificationsModule,
    DocumentsModule,
    AwardsModule,
    ContactModule,
    UploadsModule,
    SeedModule,
  ],
  providers: [
    // Global JWT guard: routes are protected unless marked @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
