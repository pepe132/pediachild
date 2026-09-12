import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { env } from '../config/env';

export const appDataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  synchronize: false,
  logging: false,
  entities: [`${__dirname}/../modules/**/*.entity.{ts,js}`],
  migrations: [`${__dirname}/migrations/*.{ts,js}`],
});
