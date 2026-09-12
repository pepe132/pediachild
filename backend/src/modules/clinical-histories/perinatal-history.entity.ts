import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ClinicalHistory } from './clinical-history.entity';

@Entity({ name: 'perinatal_histories' })
export class PerinatalHistory {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'clinical_history_id', type: 'uuid', unique: true }) clinicalHistoryId!: string;
  @OneToOne(() => ClinicalHistory, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinical_history_id' }) clinicalHistory!: ClinicalHistory;
  @Column({ name: 'maternal_age_at_pregnancy', type: 'smallint', nullable: true }) maternalAgeAtPregnancy!: number | null;
  @Column({ type: 'smallint', nullable: true }) pregnancies!: number | null;
  @Column({ type: 'smallint', nullable: true }) births!: number | null;
  @Column({ type: 'smallint', nullable: true }) cesareans!: number | null;
  @Column({ type: 'smallint', nullable: true }) abortions!: number | null;
  @Column({ name: 'pregnancy_number', type: 'smallint', nullable: true }) pregnancyNumber!: number | null;
  @Column({ name: 'pregnancy_planned', type: 'boolean', nullable: true }) pregnancyPlanned!: boolean | null;
  @Column({ name: 'pregnancy_desired', type: 'boolean', nullable: true }) pregnancyDesired!: boolean | null;
  @Column({ name: 'pregnancy_notes', type: 'text', nullable: true }) pregnancyNotes!: string | null;
  @Column({ name: 'prenatal_visits', type: 'smallint', nullable: true }) prenatalVisits!: number | null;
  @Column({ name: 'ultrasound_notes', type: 'text', nullable: true }) ultrasoundNotes!: string | null;
  @Column({ name: 'maternal_vaccines_notes', type: 'text', nullable: true }) maternalVaccinesNotes!: string | null;
  @Column({ name: 'maternal_conditions_notes', type: 'text', nullable: true }) maternalConditionsNotes!: string | null;
  @Column({ name: 'birth_route', type: 'varchar', length: 200, nullable: true }) birthRoute!: string | null;
  @Column({ name: 'birth_place', type: 'varchar', length: 300, nullable: true }) birthPlace!: string | null;
  @Column({ name: 'gestational_age_weeks', type: 'smallint', nullable: true }) gestationalAgeWeeks!: number | null;
  @Column({ name: 'gestational_age_days', type: 'smallint', nullable: true }) gestationalAgeDays!: number | null;
  @Column({ name: 'birth_weight_grams', type: 'integer', nullable: true }) birthWeightGrams!: number | null;
  @Column({ name: 'birth_length_cm', type: 'numeric', precision: 5, scale: 2, nullable: true, transformer: { to: (v: number | null) => v, from: (v: string | null) => v === null ? null : Number(v) } }) birthLengthCm!: number | null;
  @Column({ type: 'varchar', length: 100, nullable: true }) apgar!: string | null;
  @Column({ name: 'cried_and_breathed_at_birth', type: 'boolean', nullable: true }) criedAndBreathedAtBirth!: boolean | null;
  @Column({ name: 'metabolic_screening_notes', type: 'text', nullable: true }) metabolicScreeningNotes!: string | null;
  @Column({ name: 'hearing_screening_notes', type: 'text', nullable: true }) hearingScreeningNotes!: string | null;
  @Column({ name: 'cardiac_screening_notes', type: 'text', nullable: true }) cardiacScreeningNotes!: string | null;
  @Column({ name: 'ophthalmological_screening_notes', type: 'text', nullable: true }) ophthalmologicalScreeningNotes!: string | null;
  @Column({ name: 'hip_screening_notes', type: 'text', nullable: true }) hipScreeningNotes!: string | null;
  @Column({ name: 'perinatal_hospitalization_notes', type: 'text', nullable: true }) perinatalHospitalizationNotes!: string | null;
}
