import { createHash, randomBytes } from 'node:crypto';
import type { DataSource } from 'typeorm';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError } from '../../shared/errors/app-error';
import type { MailService } from './mail.service';
import { hashPassword } from './password';
import { PasswordResetToken } from './password-reset-token.entity';
import { Session } from './session.entity';
import { User } from './user.entity';

export class PasswordRecoveryService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly mail: MailService,
  ) {}

  async request(identifier: string) {
    const user = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .where('LOWER(user.email) = :identifier OR user.phone = :identifier', { identifier })
      .getOne();

    // Deliberately return the same response for unknown, disabled, and unapproved accounts.
    if (!user || !user.active || !user.approvedAt) return;

    const rawToken = randomBytes(32).toString('base64url');
    const repository = this.dataSource.getRepository(PasswordResetToken);

    await repository.delete({ userId: user.id });
    await repository.save(
      repository.create({
        userId: user.id,
        tokenHash: digest(rawToken),
        expiresAt: new Date(Date.now() + 30 * 60_000),
        usedAt: null,
      }),
    );

    const baseUrl = (env.PUBLIC_APP_URL ?? env.FRONTEND_URL).replace(/\/$/, '');
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
    try {
      await this.mail.sendPasswordReset(user.email, user.name, resetUrl);
    } catch (error) {
      // Keep the public response indistinguishable to prevent account enumeration.
      logger.error({ error, userId: user.id }, 'Could not send password reset email');
    }
  }

  async reset(token: string, newPassword: string) {
    await this.dataSource.transaction(async (manager) => {
      const record = await manager
        .getRepository(PasswordResetToken)
        .createQueryBuilder('token')
        .addSelect('token.tokenHash')
        .setLock('pessimistic_write')
        .where('token.tokenHash = :hash', { hash: digest(token) })
        .getOne();

      if (!record || record.usedAt || record.expiresAt <= new Date()) {
        throw new AppError(
          400,
          'RESET_TOKEN_INVALID',
          'El enlace es inválido o ya expiró.',
        );
      }

      await manager.getRepository(User).update(record.userId, {
        passwordHash: await hashPassword(newPassword),
      });
      record.usedAt = new Date();
      await manager.getRepository(PasswordResetToken).save(record);
      await manager.getRepository(Session).delete({ userId: record.userId });
    });
  }
}

function digest(value: string) {
  return createHash('sha256').update(value).digest('hex');
}
