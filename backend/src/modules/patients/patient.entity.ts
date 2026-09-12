import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { User } from '../auth/user.entity';

export enum AgeUnit {
  DAYS = 'DAYS',
  MONTHS = 'MONTHS',
  YEARS = 'YEARS',
}

export enum PatientSex { FEMALE = 'FEMALE', MALE = 'MALE' }

@Entity({ name: 'patients' })
@Index('IDX_patients_owner_created_at', ['pediatricianId', 'createdAt'])
@Index('IDX_patients_owner_name', ['pediatricianId', 'lastName', 'firstName'])
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'pediatrician_id', type: 'uuid' })
  pediatricianId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pediatrician_id' })
  pediatrician!: User;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ name: 'age_value', type: 'integer' })
  ageValue!: number;

  @Column({ name: 'age_unit', type: 'enum', enum: AgeUnit, enumName: 'age_unit' })
  ageUnit!: AgeUnit;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth!: string | null;

  @Column({ type: 'enum', enum: PatientSex, enumName: 'patient_sex', nullable: true })
  sex!: PatientSex | null;

  @Column({ name: 'place_of_birth', type: 'varchar', length: 300, nullable: true })
  placeOfBirth!: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
