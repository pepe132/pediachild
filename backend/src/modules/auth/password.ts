import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;
const ALGORITHM = 'scrypt';

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(password, salt, KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt);
  return `${ALGORITHM}$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [algorithm, encodedSalt, encodedKey] = encodedHash.split('$');
  if (algorithm !== ALGORITHM || !encodedSalt || !encodedKey) {
    return false;
  }

  const storedKey = Buffer.from(encodedKey, 'base64url');
  if (storedKey.length !== KEY_LENGTH) {
    return false;
  }

  const derivedKey = await scrypt(password, Buffer.from(encodedSalt, 'base64url'));
  return timingSafeEqual(storedKey, derivedKey);
}
