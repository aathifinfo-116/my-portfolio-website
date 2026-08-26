import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';

loadEnv();

/**
 * Standalone DataSource used by the TypeORM CLI for migrations.
 * The running app builds its own connection in AppModule via ConfigService.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'portfolio',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
