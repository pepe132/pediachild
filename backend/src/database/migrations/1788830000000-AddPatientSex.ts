import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPatientSex1788830000000 implements MigrationInterface {
  name = 'AddPatientSex1788830000000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TYPE "patient_sex" AS ENUM ('FEMALE', 'MALE')`);
    await q.query(`ALTER TABLE "patients" ADD COLUMN "sex" "patient_sex"`);
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "patients" DROP COLUMN "sex"`);
    await q.query(`DROP TYPE "patient_sex"`);
  }
}
