import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandConfirmedClinicalFields1788660000000 implements MigrationInterface {
  name = 'ExpandConfirmedClinicalFields1788660000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "patients" ADD COLUMN "place_of_birth" varchar(300)`);
    await q.query(`ALTER TABLE "clinical_histories" ADD COLUMN "edi_result_notes" text`);
    await q.query(`ALTER TABLE "perinatal_histories" ADD COLUMN "ophthalmological_screening_notes" text`);
    await q.query(`ALTER TABLE "perinatal_histories" ADD COLUMN "hip_screening_notes" text`);
    await q.query(`ALTER TABLE "anthropometric_measurements" ADD COLUMN "bmi" numeric(5,2)`);
    await q.query(`ALTER TABLE "anthropometric_measurements" ADD COLUMN "head_circumference_cm" numeric(5,2)`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "anthropometric_measurements" DROP COLUMN "head_circumference_cm"`);
    await q.query(`ALTER TABLE "anthropometric_measurements" DROP COLUMN "bmi"`);
    await q.query(`ALTER TABLE "perinatal_histories" DROP COLUMN "hip_screening_notes"`);
    await q.query(`ALTER TABLE "perinatal_histories" DROP COLUMN "ophthalmological_screening_notes"`);
    await q.query(`ALTER TABLE "clinical_histories" DROP COLUMN "edi_result_notes"`);
    await q.query(`ALTER TABLE "patients" DROP COLUMN "place_of_birth"`);
  }
}
