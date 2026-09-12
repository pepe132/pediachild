import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
@Entity({ name: 'specialist_profiles' })
export class SpecialistProfile {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'user_id', type: 'uuid', unique: true }) userId!: string;
  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_id' }) user!: User;
  @Column({ type: 'varchar', length: 150 }) specialty!: string;
  @Column({ name: 'professional_license', type: 'varchar', length: 100 }) professionalLicense!: string;
  @Column({ name: 'specialty_license', type: 'varchar', length: 100, nullable: true }) specialtyLicense!: string | null;
  @Column({ name: 'clinic_name', type: 'varchar', length: 200, nullable: true }) clinicName!: string | null;
  @Column({ name: 'clinic_phone', type: 'varchar', length: 20, nullable: true }) clinicPhone!: string | null;
  @Column({ name: 'clinic_address', type: 'text', nullable: true }) clinicAddress!: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
