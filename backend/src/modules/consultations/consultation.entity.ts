import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Appointment } from '../appointments/appointment.entity';
import { User } from '../auth/user.entity';
import { AgeUnit, Patient } from '../patients/patient.entity';
import { Diagnosis } from './diagnosis.entity';
import { Treatment } from './treatment.entity';
import { VitalSigns } from './vital-signs.entity';
import { AnthropometricMeasurement } from './anthropometric-measurement.entity';

export enum ConsultationStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

@Entity({ name: 'consultations' })
@Index('IDX_consultations_owner_date', ['pediatricianId', 'consultationDate'])
@Index('IDX_consultations_patient_date', ['patientId', 'consultationDate'])
export class Consultation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => Patient, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patient_id' })
  patient!: Patient;

  @Column({ name: 'pediatrician_id', type: 'uuid' })
  pediatricianId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pediatrician_id' })
  pediatrician!: User;

  @Index({ unique: true })
  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId!: string | null;

  @OneToOne(() => Appointment, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment!: Appointment | null;

  @Column({ name: 'consultation_date', type: 'timestamptz' })
  consultationDate!: Date;

  @Column({ name: 'patient_age_value', type: 'integer' })
  patientAgeValue!: number;

  @Column({ name: 'patient_age_unit', type: 'enum', enum: AgeUnit, enumName: 'age_unit' })
  patientAgeUnit!: AgeUnit;

  @Column({ type: 'varchar', length: 500 })
  reason!: string;

  @Column({ name: 'current_illness', type: 'text', nullable: true })
  currentIllness!: string | null;

  @Column({ name: 'physical_examination', type: 'text', nullable: true })
  physicalExamination!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'laboratory_notes', type: 'text', nullable: true })
  laboratoryNotes!: string | null;

  @Column({ name: 'imaging_notes', type: 'text', nullable: true })
  imagingNotes!: string | null;

  @Column({
    type: 'enum',
    enum: ConsultationStatus,
    enumName: 'consultation_status',
    default: ConsultationStatus.IN_PROGRESS,
  })
  status!: ConsultationStatus;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @OneToMany(() => Diagnosis, (diagnosis) => diagnosis.consultation)
  diagnoses!: Diagnosis[];

  @OneToMany(() => Treatment, (treatment) => treatment.consultation)
  treatments!: Treatment[];

  @OneToOne(() => VitalSigns, (vitalSigns) => vitalSigns.consultation)
  vitalSigns!: VitalSigns | null;

  @OneToOne(() => AnthropometricMeasurement, (measurement) => measurement.consultation)
  anthropometricMeasurement!: AnthropometricMeasurement | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
