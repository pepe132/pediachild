import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAppointments1788410000000 implements MigrationInterface {
  name = 'CreateAppointments1788410000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gist"`);
    await queryRunner.query(`
      CREATE TYPE "appointment_status" AS ENUM (
        'SCHEDULED',
        'CONFIRMED',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "patient_id" uuid NOT NULL,
        "pediatrician_id" uuid NOT NULL,
        "scheduled_at" timestamptz NOT NULL,
        "duration_minutes" integer NOT NULL DEFAULT 30,
        "ends_at" timestamptz NOT NULL,
        "reason" varchar(500) NOT NULL,
        "notes" text,
        "status" "appointment_status" NOT NULL DEFAULT 'SCHEDULED',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appointments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_appointments_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_appointments_pediatrician" FOREIGN KEY ("pediatrician_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_appointments_duration" CHECK ("duration_minutes" BETWEEN 5 AND 480),
        CONSTRAINT "CK_appointments_time_range" CHECK ("ends_at" > "scheduled_at"),
        CONSTRAINT "EX_appointments_pediatrician_schedule" EXCLUDE USING gist (
          "pediatrician_id" WITH =,
          tstzrange("scheduled_at", "ends_at", '[)') WITH &&
        ) WHERE ("status" IN ('SCHEDULED', 'CONFIRMED'))
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_appointments_owner_scheduled_at" ON "appointments" ("pediatrician_id", "scheduled_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_appointments_patient_scheduled_at" ON "appointments" ("patient_id", "scheduled_at")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "appointments"`);
    await queryRunner.query(`DROP TYPE "appointment_status"`);
  }
}
