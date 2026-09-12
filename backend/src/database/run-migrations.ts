import 'reflect-metadata';

import { appDataSource } from './data-source';

async function runMigrations() {
  await appDataSource.initialize();
  const migrations = await appDataSource.runMigrations({ transaction: 'all' });

  if (migrations.length === 0) {
    console.log('Database is already up to date.');
    return;
  }

  for (const migration of migrations) {
    console.log(`Migration applied: ${migration.name}`);
  }
}

runMigrations()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown migration error';
    console.error(`Could not run migrations: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (appDataSource.isInitialized) {
      await appDataSource.destroy();
    }
  });
