import { createHash, randomBytes } from 'node:crypto';

import { LessThan, type Repository } from 'typeorm';

import { env } from '../../config/env';
import { AppError } from '../../shared/errors/app-error';
import type { ChangePasswordInput, LoginInput, RegisterInput } from './auth.schemas';
import { hashPassword, verifyPassword } from './password';
import { SpecialistProfile } from './specialist-profile.entity';
import { Session } from './session.entity';
import { User, UserRole } from './user.entity';

const DUMMY_PASSWORD_HASH = `scrypt$ZHVtbXktc2FsdC0xMjM0NQ$${Buffer.alloc(64).toString('base64url')}`;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  profile?: { specialty: string; professionalLicense: string; specialtyLicense: string | null; clinicName: string | null; clinicPhone: string | null; clinicAddress: string | null };
}

export interface AuthServiceContract {
  login(input: LoginInput): Promise<{ token: string; expiresAt: Date; user: PublicUser }>;
  register?(input: RegisterInput): Promise<PublicUser>;
  changePassword?(userId: string, input: ChangePasswordInput): Promise<void>;
  authenticate(token: string): Promise<PublicUser | null>;
  logout(token: string): Promise<void>;
}

export class AuthService implements AuthServiceContract {
  constructor(
    private readonly users: Repository<User>,
    private readonly sessions: Repository<Session>,
  ) {}

  async login(input: LoginInput): Promise<{ token: string; expiresAt: Date; user: PublicUser }> {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = :identifier OR user.phone = :identifier', { identifier: input.identifier })
      .getOne();

    const passwordIsValid = await verifyPassword(
      input.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !passwordIsValid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'El correo, teléfono o contraseña son incorrectos.');
    }
    if (!user.active || !user.approvedAt) throw new AppError(403, 'ACCOUNT_PENDING_APPROVAL', 'Tu cuenta está pendiente de validación profesional.');

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);

    await this.sessions.save(
      this.sessions.create({
        tokenHash: this.hashToken(token),
        userId: user.id,
        expiresAt,
        lastUsedAt: null,
      }),
    );
    const activeSessions = await this.sessions.find({ where: { userId: user.id }, order: { createdAt: 'DESC' } });
    if (activeSessions.length > 5) await this.sessions.remove(activeSessions.slice(5));

    return { token, expiresAt, user: this.toPublicUser(user) };
  }

  async register(input: RegisterInput): Promise<PublicUser> {
    const existing = await this.users.createQueryBuilder('user').where('LOWER(user.email) = :email OR user.phone = :phone', { email: input.email, phone: input.phone }).getOne();
    if (existing) throw new AppError(409, 'ACCOUNT_ALREADY_EXISTS', 'Ya existe una cuenta con ese correo o teléfono.');
    const user = await this.users.manager.transaction(async (manager) => {
      const saved = await manager.getRepository(User).save(manager.getRepository(User).create({ name: input.name, email: input.email, phone: input.phone, passwordHash: await hashPassword(input.password), role: UserRole.PEDIATRICIAN, active: false, approvedAt: null }));
      const profile = await manager.getRepository(SpecialistProfile).save(manager.getRepository(SpecialistProfile).create({ userId: saved.id, specialty: input.specialty, professionalLicense: input.professionalLicense, specialtyLicense: input.specialtyLicense || null, clinicName: input.clinicName || null, clinicPhone: input.clinicPhone || null, clinicAddress: input.clinicAddress || null }));
      saved.profile = profile; return saved;
    });
    return this.toPublicUser(user);
  }

  async authenticate(token: string): Promise<PublicUser | null> {
    const session = await this.sessions
      .createQueryBuilder('session')
      .addSelect('session.tokenHash')
      .innerJoinAndSelect('session.user', 'user')
      .where('session.tokenHash = :tokenHash', { tokenHash: this.hashToken(token) })
      .andWhere('session.expiresAt > :now', { now: new Date() })
      .andWhere('user.active = true')
      .getOne();

    if (!session) {
      return null;
    }

    await this.sessions.update(session.id, { lastUsedAt: new Date() });
    return this.toPublicUser(session.user);
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await this.users.createQueryBuilder('user').addSelect('user.passwordHash').where('user.id = :userId', { userId }).getOne();
    if (!user || !(await verifyPassword(input.currentPassword, user.passwordHash))) throw new AppError(400, 'CURRENT_PASSWORD_INVALID', 'La contraseña actual es incorrecta.');
    await this.users.manager.transaction(async manager => {
      await manager.getRepository(User).update(userId, { passwordHash: await hashPassword(input.newPassword) });
      await manager.getRepository(Session).delete({ userId });
    });
  }

  async logout(token: string): Promise<void> {
    await this.sessions.delete({ tokenHash: this.hashToken(token) });
  }

  async deleteExpiredSessions(): Promise<void> {
    await this.sessions.delete({ expiresAt: LessThan(new Date()) });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toPublicUser(user: User): PublicUser {
    return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, ...(user.profile ? { profile: { specialty: user.profile.specialty, professionalLicense: user.profile.professionalLicense, specialtyLicense: user.profile.specialtyLicense, clinicName: user.profile.clinicName, clinicPhone: user.profile.clinicPhone, clinicAddress: user.profile.clinicAddress } } : {}) };
  }
}
