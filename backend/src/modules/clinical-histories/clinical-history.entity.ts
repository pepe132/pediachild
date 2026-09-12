import { Column, CreateDateColumn, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Patient } from '../patients/patient.entity';

export enum ImmunizationStatus {
  COMPLETE = 'COMPLETE',
  INCOMPLETE = 'INCOMPLETE',
  UNKNOWN = 'UNKNOWN',
}

@Entity({ name: 'clinical_histories' })
export class ClinicalHistory {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index({ unique: true }) @Column({ name: 'patient_id', type: 'uuid' }) patientId!: string;
  @OneToOne(() => Patient, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'patient_id' }) patient!: Patient;
  @Column({ name: 'informant_name', type: 'varchar', length: 200, nullable: true }) informantName!: string | null;
  @Column({ name: 'informant_relationship', type: 'varchar', length: 100, nullable: true }) informantRelationship!: string | null;
  @Column({ name: 'siblings_history', type: 'text', nullable: true }) siblingsHistory!: string | null;
  @Column({ name: 'grandparents_history', type: 'text', nullable: true }) grandparentsHistory!: string | null;
  @Column({ name: 'neurodevelopment_notes', type: 'text', nullable: true }) neurodevelopmentNotes!: string | null;
  @Column({ name: 'edi_result_notes', type: 'text', nullable: true }) ediResultNotes!: string | null;
  @Column({ name: 'schooling_notes', type: 'text', nullable: true }) schoolingNotes!: string | null;
  @Column({ name: 'immunization_status', type: 'enum', enum: ImmunizationStatus, enumName: 'immunization_status', default: ImmunizationStatus.UNKNOWN }) immunizationStatus!: ImmunizationStatus;
  @Column({ name: 'missing_vaccines', type: 'text', nullable: true }) missingVaccines!: string | null;
  @Column({ name: 'immunization_notes', type: 'text', nullable: true }) immunizationNotes!: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
