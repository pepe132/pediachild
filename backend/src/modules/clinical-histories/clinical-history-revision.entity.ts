import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'clinical_history_revisions' })
@Index('IDX_history_revision_created', ['clinicalHistoryId', 'createdAt'])
export class ClinicalHistoryRevision {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'clinical_history_id', type: 'uuid' }) clinicalHistoryId!: string;
  @Column({ name: 'changed_by', type: 'uuid' }) changedBy!: string;
  @Column({ type: 'jsonb' }) snapshot!: Record<string, unknown>;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}
