import * as Joi from 'joi';

/**
 * Fail fast on boot rather than at the first request that needs a missing var.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(4000),
  API_PREFIX: Joi.string().default('api'),
  CORS_ORIGINS: Joi.string().default('http://localhost:5173'),
  PUBLIC_BASE_URL: Joi.string().uri().default('http://localhost:4000'),

  // Either a single DATABASE_URL (what managed providers hand you) or the
  // discrete DB_* fields. The discrete ones are only required without a URL.
  DATABASE_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }),
  DB_HOST: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_PASSWORD: Joi.string().allow('').when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_NAME: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_SYNCHRONIZE: Joi.string().valid('true', 'false').default('false'),
  DB_LOGGING: Joi.string().valid('true', 'false').default('false'),
  DB_SSL: Joi.string().valid('true', 'false'),
  DB_POOL_SIZE: Joi.number().min(1).max(50),

  JWT_SECRET: Joi.string().min(16).required().messages({
    'string.min': 'JWT_SECRET must be at least 16 characters.',
  }),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  ADMIN_EMAIL: Joi.string().email().required(),
  ADMIN_PASSWORD: Joi.string().min(8).required(),

  STORAGE_DRIVER: Joi.string().valid('local', 'cloudinary', 's3').default('local'),
  UPLOAD_DIR: Joi.string().default('./uploads'),
  MAX_UPLOAD_MB: Joi.number().default(10),
});
