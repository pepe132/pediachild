import 'dotenv/config';

import { Client } from 'pg';

const DATABASE_NAME = 'pediachild';

async function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.');
  }

  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = '/postgres';

  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();

  try {
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      DATABASE_NAME,
    ]);

    if (result.rowCount === 0) {
      await client.query('CREATE DATABASE "pediachild"');
      console.log(`Database ${DATABASE_NAME} created.`);
      return;
    }

    console.log(`Database ${DATABASE_NAME} already exists.`);
  } finally {
    await client.end();
  }
}

createDatabase().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown database error';
  console.error(`Could not create database: ${message}`);
  process.exitCode = 1;
});
