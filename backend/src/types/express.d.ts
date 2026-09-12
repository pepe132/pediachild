import type { PublicUser } from '../modules/auth/auth.service';

declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: PublicUser;
    }
  }
}

export {};
