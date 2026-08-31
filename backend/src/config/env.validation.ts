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
  // discrete DB_* fields, which are required only when no URL is present.
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
  DB_SSL: Joi.string().valid('true', 'false'),
  DB_POOL_SIZE: Joi.number().min(1).max(50),
  DB_SYNCHRONIZE: Joi.string().valid('true', 'false').default('false'),
  DB_LOGGING: Joi.string().valid('true', 'false').default('false'),

  JWT_SECRET: Joi.string().min(16).required().messages({
    'string.min': 'JWT_SECRET must be at least 16 characters.',
  }),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  ADMIN_EMAIL: Joi.string().email().required(),
  ADMIN_PASSWORD: Joi.string().min(8).required(),

  STORAGE_DRIVER: Joi.string()
    .valid('local', 'vercel-blob', 'cloudinary', 's3')
    .default('local'),
  // Injected by Vercel when a Blob store is connected to the project. Required
  // only when the blob driver is selected; locally it comes from `vercel env
  // pull` or the store's "read-write token" connection option.
  // Deliberately optional, not required-when-blob: a Blob store connected
  // with OIDC authenticates the SDK without this variable, and failing boot
  // on its absence would break a deployment that works. When it is genuinely
  // missing, @vercel/blob raises its own explicit error at upload time.
  BLOB_READ_WRITE_TOKEN: Joi.string().optional(),
  // Empty string is meaningful (store at the root), so allow it explicitly.
  BLOB_PATH_PREFIX: Joi.string().allow('').optional(),
  UPLOAD_DIR: Joi.string().default('./uploads'),
  MAX_UPLOAD_MB: Joi.number().default(10),
});
