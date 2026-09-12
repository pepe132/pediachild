import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConsultations1788415000000 implements MigrationInterface {
  name = 'CreateConsultations1788415000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "consultation_status" AS ENUM ('IN_PROGRESS', 'COMPLETED')`);
    await queryRunner.query(`
      CREATE TABLE "consultations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "patient_id" uuid NOT NULL,
        "pediatrician_id" uuid NOT NULL,
        "appointment_id" uuid,
        "consultation_date" timestamptz NOT NULL,
        "patient_age_value" integer NOT NULL,
        "patient_age_unit" "age_unit" NOT NULL,
        "reason" varchar(500) NOT NULL,
        "current_illness" text,
        "physical_examination" text,
        "notes" text,
        "laboratory_notes" text,
        "imaging_notes" text,
        "status" "consultation_status" NOT NULL DEFAULT 'IN_PROGRESS',
        "completed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_consultations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_consultations_appointment" UNIQUE ("appointment_id"),
        CONSTRAINT "FK_consultations_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_consultations_pediatrician" FOREIGN KEY ("pediatrician_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_consultations_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_consultations_age_value" CHECK ("patient_age_value" BETWEEN 0 AND 10000),
        CONSTRAINT "CK_consultations_completion" CHECK (
          ("status" = 'IN_PROGRESS' AND "completed_at" IS NULL)
          OR ("status" = 'COMPLETED' AND "completed_at" IS NOT NULL)
        )
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_consultations_owner_date" ON "consultations" ("pediatrician_id", "consultation_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_consultations_patient_date" ON "consultations" ("patient_id", "consultation_date")`);

    await queryRunner.query(`
      CREATE TABLE "diagnoses" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "consultation_id" uuid NOT NULL,
        "description" varchar(1000) NOT NULL,
        "code" varchar(50),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_diagnoses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_diagnoses_consultation" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_diagnoses_consultation_id" ON "diagnoses" ("consultation_id")`);

    await queryRunner.query(`
      CREATE TABLE "treatments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "consultation_id" uuid NOT NULL,
        "description" varchar(500) NOT NULL,
        "dose" varchar(200),
        "route" varchar(100),
        "frequency" varchar(200),
        "duration" varchar(200),
        "instructions" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_treatments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_treatments_consultation" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_treatments_consultation_id" ON "treatments" ("consultation_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "treatments"`);
    await queryRunner.query(`DROP TABLE "diagnoses"`);
    await queryRunner.query(`DROP TABLE "consultations"`);
    await queryRunner.query(`DROP TYPE "consultation_status"`);
  }
}
