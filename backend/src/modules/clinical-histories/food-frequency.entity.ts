import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ClinicalHistory } from './clinical-history.entity';

export enum FoodType { RED_MEAT='RED_MEAT', CHICKEN='CHICKEN', EGG='EGG', MILK='MILK', FISH='FISH', CEREALS='CEREALS', TORTILLA='TORTILLA', LEGUMES='LEGUMES', VEGETABLES='VEGETABLES', FRUITS='FRUITS', SODA='SODA', BREAD='BREAD' }

@Entity({ name: 'food_frequencies' })
@Index('UQ_food_frequency_type', ['clinicalHistoryId', 'foodType'], { unique: true })
export class FoodFrequency {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'clinical_history_id', type: 'uuid' }) clinicalHistoryId!: string;
  @ManyToOne(() => ClinicalHistory, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinical_history_id' }) clinicalHistory!: ClinicalHistory;
  @Column({ name: 'food_type', type: 'enum', enum: FoodType, enumName: 'food_type' }) foodType!: FoodType;
  @Column({ name: 'days_per_week', type: 'smallint' }) daysPerWeek!: number;
}
