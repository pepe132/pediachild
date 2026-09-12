import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Consultation } from './consultation.entity';

export enum MeasurementPosition {
  RECUMBENT_LENGTH = 'RECUMBENT_LENGTH',
  STANDING_HEIGHT = 'STANDING_HEIGHT',
}

const numericTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

@Entity({ name: 'anthropometric_measurements' })
export class AnthropometricMeasurement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'consultation_id', type: 'uuid', unique: true })
  consultationId!: string;

  @OneToOne(() => Consultation, (consultation) => consultation.anthropometricMeasurement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultation_id' })
  consultation!: Consultation;

  @Column({ name: 'weight_kg', type: 'numeric', precision: 6, scale: 3, nullable: true, transformer: numericTransformer })
  weightKg!: number | null;

  @Column({ name: 'length_height_cm', type: 'numeric', precision: 6, scale: 2, nullable: true, transformer: numericTransformer })
  lengthHeightCm!: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, transformer: numericTransformer })
  bmi!: number | null;

  @Column({ name: 'head_circumference_cm', type: 'numeric', precision: 5, scale: 2, nullable: true, transformer: numericTransformer })
  headCircumferenceCm!: number | null;

  @Column({ name: 'measurement_position', type: 'enum', enum: MeasurementPosition, enumName: 'measurement_position', nullable: true })
  measurementPosition!: MeasurementPosition | null;

  @Column({ name: 'weight_for_age_percentile', type: 'smallint', nullable: true })
  weightForAgePercentile!: number | null;

  @Column({ name: 'weight_for_length_height_percentile', type: 'smallint', nullable: true })
  weightForLengthHeightPercentile!: number | null;

  @Column({ name: 'length_height_for_age_percentile', type: 'smallint', nullable: true })
  lengthHeightForAgePercentile!: number | null;

  @Column({ name: 'nutritional_diagnosis', type: 'varchar', length: 2_000, nullable: true })
  nutritionalDiagnosis!: string | null;
}
