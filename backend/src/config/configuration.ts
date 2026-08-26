export interface AppConfig {
  env: string;
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
  publicBaseUrl: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging: boolean;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface StorageConfig {
  driver: 'local' | 'cloudinary' | 's3';
  uploadDir: string;
  maxUploadBytes: number;
}

export default () => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '4000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:4000',
  } satisfies AppConfig,
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'portfolio',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
  } satisfies DatabaseConfig,
  jwt: {
    secret: process.env.JWT_SECRET as string,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  } satisfies JwtConfig,
  storage: {
    driver: (process.env.STORAGE_DRIVER ?? 'local') as StorageConfig['driver'],
    uploadDir: process.env.UPLOAD_DIR ?? './uploads',
    maxUploadBytes: parseInt(process.env.MAX_UPLOAD_MB ?? '10', 10) * 1024 * 1024,
  } satisfies StorageConfig,
  admin: {
    email: process.env.ADMIN_EMAIL ?? 'admin@example.com',
    password: process.env.ADMIN_PASSWORD ?? 'ChangeThisPassword123!',
  },
});
