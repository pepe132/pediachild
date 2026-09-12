import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'consultation_revisions' })
@Index('IDX_revision_consultation_created', ['consultationId', 'createdAt'])
export class ConsultationRevision {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'consultation_id', type: 'uuid' }) consultationId!: string;
  @Column({ name: 'changed_by', type: 'uuid' }) changedBy!: string;
  @Column({ type: 'jsonb' }) snapshot!: Record<string, unknown>;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}
