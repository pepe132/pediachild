import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Consultation } from './consultation.entity';

@Entity({ name: 'treatments' })
export class Treatment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'consultation_id', type: 'uuid' })
  consultationId!: string;

  @ManyToOne(() => Consultation, (consultation) => consultation.treatments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultation_id' })
  consultation!: Consultation;

  @Column({ type: 'varchar', length: 500 })
  description!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  dose!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  route!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  frequency!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  duration!: string | null;

  @Column({ type: 'text', nullable: true })
  instructions!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
