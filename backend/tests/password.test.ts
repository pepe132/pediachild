import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from '../src/modules/auth/password';

describe('password hashing', () => {
  it('hashes and verifies a password using scrypt', async () => {
    const hash = await hashPassword('a-strong-test-password');

    expect(hash).not.toContain('a-strong-test-password');
    await expect(verifyPassword('a-strong-test-password', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });
});
