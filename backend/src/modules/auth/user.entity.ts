import { Column, CreateDateColumn, Entity, Index, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Session } from './session.entity';
import { SpecialistProfile } from './specialist-profile.entity';

export enum UserRole {
  PEDIATRICIAN = 'PEDIATRICIAN',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 254 })
  email!: string;
  @Column({ type: 'varchar', length: 20, nullable: true }) phone!: string | null;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role', default: UserRole.PEDIATRICIAN })
  role!: UserRole;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];
  @OneToOne(() => SpecialistProfile, (profile) => profile.user, { eager: true }) profile!: SpecialistProfile;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
