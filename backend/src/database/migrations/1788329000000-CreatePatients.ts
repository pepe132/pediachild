import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePatients1788329000000 implements MigrationInterface {
  name = 'CreatePatients1788329000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "age_unit" AS ENUM ('DAYS', 'MONTHS', 'YEARS')`);
    await queryRunner.query(`
      CREATE TABLE "patients" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "pediatrician_id" uuid NOT NULL,
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "age_value" integer NOT NULL,
        "age_unit" "age_unit" NOT NULL,
        "date_of_birth" date,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_patients" PRIMARY KEY ("id"),
        CONSTRAINT "FK_patients_pediatrician" FOREIGN KEY ("pediatrician_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_patients_age_value" CHECK ("age_value" >= 0 AND "age_value" <= 10000),
        CONSTRAINT "CK_patients_birth_date" CHECK ("date_of_birth" IS NULL OR "date_of_birth" <= CURRENT_DATE)
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_patients_pediatrician_id" ON "patients" ("pediatrician_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_patients_owner_created_at" ON "patients" ("pediatrician_id", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_patients_owner_name" ON "patients" ("pediatrician_id", "last_name", "first_name")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "patients"`);
    await queryRunner.query(`DROP TYPE "age_unit"`);
  }
}
