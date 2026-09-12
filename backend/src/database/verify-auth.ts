import 'reflect-metadata';
import 'dotenv/config';

import { z } from 'zod';

import { loginSchema } from '../modules/auth/auth.schemas';
import { AuthService } from '../modules/auth/auth.service';
import { Session } from '../modules/auth/session.entity';
import { User } from '../modules/auth/user.entity';
import { appDataSource } from './data-source';

const credentialsSchema = z.object({
  INITIAL_USER_EMAIL: z.string(),
  INITIAL_USER_PASSWORD: z.string(),
});

async function verifyAuth() {
  const credentials = credentialsSchema.parse(process.env);
  const input = loginSchema.parse({
    email: credentials.INITIAL_USER_EMAIL,
    password: credentials.INITIAL_USER_PASSWORD,
  });

  await appDataSource.initialize();
  const authService = new AuthService(
    appDataSource.getRepository(User),
    appDataSource.getRepository(Session),
  );

  const login = await authService.login(input);
  const authenticatedUser = await authService.authenticate(login.token);
  if (authenticatedUser?.id !== login.user.id) {
    throw new Error('Created session could not be authenticated.');
  }

  await authService.logout(login.token);
  const revokedSessionUser = await authService.authenticate(login.token);
  if (revokedSessionUser !== null) {
    throw new Error('Session remained active after logout.');
  }

  console.log('Authentication smoke test passed: login, session and logout work correctly.');
}

verifyAuth()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown authentication error';
    console.error(`Authentication smoke test failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (appDataSource.isInitialized) {
      await appDataSource.destroy();
    }
  });
