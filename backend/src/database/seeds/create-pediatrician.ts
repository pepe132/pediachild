import 'reflect-metadata';
import 'dotenv/config';

import { z } from 'zod';

import { logger } from '../../config/logger';
import { hashPassword } from '../../modules/auth/password';
import { User, UserRole } from '../../modules/auth/user.entity';
import { appDataSource } from '../data-source';

const seedSchema = z.object({
  INITIAL_USER_NAME: z.string().trim().min(2).max(120),
  INITIAL_USER_EMAIL: z.string().trim().toLowerCase().email().max(254),
  INITIAL_USER_PASSWORD: z.string().min(12).max(128),
});

async function seed() {
  const input = seedSchema.parse(process.env);
  await appDataSource.initialize();

  const users = appDataSource.getRepository(User);
  const existingUser = await users.findOneBy({ email: input.INITIAL_USER_EMAIL });

  if (existingUser) {
    logger.info({ email: input.INITIAL_USER_EMAIL }, 'Pediatrician already exists');
    return;
  }

  await users.save(
    users.create({
      name: input.INITIAL_USER_NAME,
      email: input.INITIAL_USER_EMAIL,
      passwordHash: await hashPassword(input.INITIAL_USER_PASSWORD),
      role: UserRole.PEDIATRICIAN,
      active: true,
      approvedAt: new Date(),
    }),
  );

  logger.info({ email: input.INITIAL_USER_EMAIL }, 'Initial pediatrician created');
}

seed()
  .catch((error: unknown) => {
    logger.fatal({ err: error }, 'Could not create initial pediatrician');
    process.exitCode = 1;
  })
  .finally(async () => {
    if (appDataSource.isInitialized) {
      await appDataSource.destroy();
    }
  });
