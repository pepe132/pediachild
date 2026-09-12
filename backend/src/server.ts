import 'reflect-metadata';

import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { appDataSource } from './database/data-source';

async function bootstrap() {
  await appDataSource.initialize();
  logger.info('Database connection established');

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'PediaChild API listening');
  });

  const shutdown = (signal: NodeJS.Signals) => {
    logger.info({ signal }, 'Shutting down PediaChild API');

    server.close(() => {
      void appDataSource.destroy().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error: unknown) => {
  logger.fatal({ err: error }, 'Could not start PediaChild API');
  process.exit(1);
});
