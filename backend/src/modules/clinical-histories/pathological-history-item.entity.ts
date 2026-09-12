import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ClinicalHistory } from './clinical-history.entity';

export enum PathologicalCategory { ALLERGY='ALLERGY', SURGERY='SURGERY', TRAUMA='TRAUMA', EXANTHEMATIC_DISEASE='EXANTHEMATIC_DISEASE', HOSPITALIZATION='HOSPITALIZATION' }
export enum ClinicalPresenceStatus { DENIED='DENIED', PRESENT='PRESENT', UNKNOWN='UNKNOWN' }

@Entity({ name: 'pathological_history_items' })
@Index('UQ_pathological_history_category', ['clinicalHistoryId', 'category'], { unique: true })
export class PathologicalHistoryItem {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'clinical_history_id', type: 'uuid' }) clinicalHistoryId!: string;
  @ManyToOne(() => ClinicalHistory, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinical_history_id' }) clinicalHistory!: ClinicalHistory;
  @Column({ type: 'enum', enum: PathologicalCategory, enumName: 'pathological_category' }) category!: PathologicalCategory;
  @Column({ type: 'enum', enum: ClinicalPresenceStatus, enumName: 'clinical_presence_status' }) status!: ClinicalPresenceStatus;
  @Column({ type: 'text', nullable: true }) description!: string | null;
}
