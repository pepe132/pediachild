import 'reflect-metadata';

import { appDataSource } from './data-source';

async function revertMigration() {
  await appDataSource.initialize();
  await appDataSource.undoLastMigration({ transaction: 'all' });
  console.log('Last migration reverted.');
}

revertMigration()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown migration error';
    console.error(`Could not revert migration: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (appDataSource.isInitialized) {
      await appDataSource.destroy();
    }
  });
