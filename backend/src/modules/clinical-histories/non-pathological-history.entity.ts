import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ClinicalHistory } from './clinical-history.entity';

@Entity({ name: 'non_pathological_histories' })
export class NonPathologicalHistory {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'clinical_history_id', type: 'uuid', unique: true }) clinicalHistoryId!: string;
  @OneToOne(() => ClinicalHistory, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinical_history_id' }) clinicalHistory!: ClinicalHistory;
  @Column({ type: 'varchar', length: 300, nullable: true }) origin!: string | null;
  @Column({ type: 'varchar', length: 300, nullable: true }) residence!: string | null;
  @Column({ name: 'housing_notes', type: 'text', nullable: true }) housingNotes!: string | null;
  @Column({ name: 'services_notes', type: 'text', nullable: true }) servicesNotes!: string | null;
  @Column({ name: 'cooking_fuel_notes', type: 'text', nullable: true }) cookingFuelNotes!: string | null;
  @Column({ name: 'water_notes', type: 'text', nullable: true }) waterNotes!: string | null;
  @Column({ name: 'bathroom_notes', type: 'text', nullable: true }) bathroomNotes!: string | null;
  @Column({ name: 'cohabitants_notes', type: 'text', nullable: true }) cohabitantsNotes!: string | null;
  @Column({ name: 'room_notes', type: 'text', nullable: true }) roomNotes!: string | null;
  @Column({ name: 'animal_contact_notes', type: 'text', nullable: true }) animalContactNotes!: string | null;
  @Column({ name: 'biomass_exposure_notes', type: 'text', nullable: true }) biomassExposureNotes!: string | null;
  @Column({ name: 'bathing_notes', type: 'text', nullable: true }) bathingNotes!: string | null;
  @Column({ name: 'clothing_change_notes', type: 'text', nullable: true }) clothingChangeNotes!: string | null;
  @Column({ name: 'tooth_brushings_per_day', type: 'smallint', nullable: true }) toothBrushingsPerDay!: number | null;
  @Column({ name: 'urination_notes', type: 'text', nullable: true }) urinationNotes!: string | null;
  @Column({ name: 'bowel_movements_per_day', type: 'numeric', precision: 4, scale: 1, nullable: true, transformer: { to: (v: number | null) => v, from: (v: string | null) => v === null ? null : Number(v) } }) bowelMovementsPerDay!: number | null;
  @Column({ name: 'bristol_type', type: 'smallint', nullable: true }) bristolType!: number | null;
}
