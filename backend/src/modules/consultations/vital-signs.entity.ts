import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Consultation } from './consultation.entity';

const numericTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

@Entity({ name: 'vital_signs' })
export class VitalSigns {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'consultation_id', type: 'uuid', unique: true })
  consultationId!: string;

  @OneToOne(() => Consultation, (consultation) => consultation.vitalSigns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultation_id' })
  consultation!: Consultation;

  @Column({ name: 'heart_rate_bpm', type: 'smallint', nullable: true })
  heartRateBpm!: number | null;

  @Column({ name: 'respiratory_rate_rpm', type: 'smallint', nullable: true })
  respiratoryRateRpm!: number | null;

  @Column({ name: 'systolic_pressure_mmhg', type: 'smallint', nullable: true })
  systolicPressureMmhg!: number | null;

  @Column({ name: 'diastolic_pressure_mmhg', type: 'smallint', nullable: true })
  diastolicPressureMmhg!: number | null;

  @Column({ name: 'oxygen_saturation_percent', type: 'smallint', nullable: true })
  oxygenSaturationPercent!: number | null;

  @Column({ name: 'temperature_c', type: 'numeric', precision: 4, scale: 1, nullable: true, transformer: numericTransformer })
  temperatureC!: number | null;

  @Column({ name: 'pulses_description', type: 'varchar', length: 1_000, nullable: true })
  pulsesDescription!: string | null;

  @Column({ name: 'capillary_refill_seconds', type: 'numeric', precision: 4, scale: 1, nullable: true, transformer: numericTransformer })
  capillaryRefillSeconds!: number | null;
}
