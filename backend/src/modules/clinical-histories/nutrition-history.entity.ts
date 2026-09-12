import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ClinicalHistory } from './clinical-history.entity';

@Entity({ name: 'nutrition_histories' })
export class NutritionHistory {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'clinical_history_id', type: 'uuid', unique: true }) clinicalHistoryId!: string;
  @OneToOne(() => ClinicalHistory, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinical_history_id' }) clinicalHistory!: ClinicalHistory;
  @Column({ name: 'exclusive_breastfeeding_notes', type: 'text', nullable: true }) exclusiveBreastfeedingNotes!: string | null;
  @Column({ name: 'complementary_feeding_notes', type: 'text', nullable: true }) complementaryFeedingNotes!: string | null;
  @Column({ name: 'family_diet_notes', type: 'text', nullable: true }) familyDietNotes!: string | null;
  @Column({ name: 'meals_per_day', type: 'smallint', nullable: true }) mealsPerDay!: number | null;
  @Column({ name: 'twenty_four_hour_recall', type: 'text', nullable: true }) twentyFourHourRecall!: string | null;
}
