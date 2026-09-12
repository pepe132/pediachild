import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Consultation } from './consultation.entity';

@Entity({ name: 'diagnoses' })
export class Diagnosis {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'consultation_id', type: 'uuid' })
  consultationId!: string;

  @ManyToOne(() => Consultation, (consultation) => consultation.diagnoses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultation_id' })
  consultation!: Consultation;

  @Column({ type: 'varchar', length: 1_000 })
  description!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  code!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
