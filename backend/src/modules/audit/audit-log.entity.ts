import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'audit_logs' })
@Index('IDX_audit_user_created', ['userId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'user_id', type: 'uuid' }) userId!: string;
  @Column({ type: 'varchar', length: 10 }) method!: string;
  @Column({ type: 'varchar', length: 500 }) path!: string;
  @Column({ name: 'status_code', type: 'smallint' }) statusCode!: number;
  @Column({ name: 'ip_hash', type: 'char', length: 64, nullable: true }) ipHash!: string | null;
  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true }) userAgent!: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}
