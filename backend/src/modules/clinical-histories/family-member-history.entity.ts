import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ClinicalHistory } from './clinical-history.entity';

export enum FamilyRelationship { MOTHER = 'MOTHER', FATHER = 'FATHER' }

@Entity({ name: 'family_member_histories' })
@Index('UQ_family_member_history_relationship', ['clinicalHistoryId', 'relationship'], { unique: true })
export class FamilyMemberHistory {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'clinical_history_id', type: 'uuid' }) clinicalHistoryId!: string;
  @ManyToOne(() => ClinicalHistory, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinical_history_id' }) clinicalHistory!: ClinicalHistory;
  @Column({ type: 'enum', enum: FamilyRelationship, enumName: 'family_relationship' }) relationship!: FamilyRelationship;
  @Column({ type: 'smallint', nullable: true }) age!: number | null;
  @Column({ type: 'varchar', length: 300, nullable: true }) origin!: string | null;
  @Column({ type: 'varchar', length: 300, nullable: true }) residence!: string | null;
  @Column({ type: 'varchar', length: 200, nullable: true }) schooling!: string | null;
  @Column({ type: 'varchar', length: 100, nullable: true }) language!: string | null;
  @Column({ type: 'varchar', length: 200, nullable: true }) occupation!: string | null;
  @Column({ type: 'varchar', length: 150, nullable: true }) religion!: string | null;
  @Column({ name: 'substance_use', type: 'text', nullable: true }) substanceUse!: string | null;
  @Column({ name: 'tattoos_piercings', type: 'text', nullable: true }) tattoosPiercings!: string | null;
  @Column({ type: 'text', nullable: true }) comorbidities!: string | null;
  @Column({ name: 'blood_type', type: 'varchar', length: 20, nullable: true }) bloodType!: string | null;
}
