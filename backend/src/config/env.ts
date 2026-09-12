import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65_535).default(3000),
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://postgres:postgres@localhost:5432/pediachild'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  SESSION_SECRET: z.string().min(32).default('development-only-secret-change-before-production'),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().max(24 * 30).default(168),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Invalid environment variables: ${z.prettifyError(parsedEnv.error)}`);
}

export const env = parsedEnv.data;

if (
  env.NODE_ENV === 'production' &&
  env.SESSION_SECRET === 'development-only-secret-change-before-production'
) {
  throw new Error('SESSION_SECRET must be explicitly configured in production.');
}
