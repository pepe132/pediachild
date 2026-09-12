import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClinicalMeasurements1788500000000 implements MigrationInterface {
  name = 'CreateClinicalMeasurements1788500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "measurement_position" AS ENUM ('RECUMBENT_LENGTH', 'STANDING_HEIGHT')`);
    await queryRunner.query(`
      CREATE TABLE "vital_signs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "consultation_id" uuid NOT NULL,
        "heart_rate_bpm" smallint,
        "respiratory_rate_rpm" smallint,
        "systolic_pressure_mmhg" smallint,
        "diastolic_pressure_mmhg" smallint,
        "oxygen_saturation_percent" smallint,
        "temperature_c" numeric(4,1),
        "pulses_description" varchar(1000),
        "capillary_refill_seconds" numeric(4,1),
        CONSTRAINT "PK_vital_signs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_vital_signs_consultation" UNIQUE ("consultation_id"),
        CONSTRAINT "FK_vital_signs_consultation" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE,
        CONSTRAINT "CK_vital_signs_heart_rate" CHECK ("heart_rate_bpm" IS NULL OR "heart_rate_bpm" BETWEEN 0 AND 400),
        CONSTRAINT "CK_vital_signs_respiratory_rate" CHECK ("respiratory_rate_rpm" IS NULL OR "respiratory_rate_rpm" BETWEEN 0 AND 200),
        CONSTRAINT "CK_vital_signs_systolic" CHECK ("systolic_pressure_mmhg" IS NULL OR "systolic_pressure_mmhg" BETWEEN 0 AND 400),
        CONSTRAINT "CK_vital_signs_diastolic" CHECK ("diastolic_pressure_mmhg" IS NULL OR "diastolic_pressure_mmhg" BETWEEN 0 AND 300),
        CONSTRAINT "CK_vital_signs_saturation" CHECK ("oxygen_saturation_percent" IS NULL OR "oxygen_saturation_percent" BETWEEN 0 AND 100),
        CONSTRAINT "CK_vital_signs_temperature" CHECK ("temperature_c" IS NULL OR "temperature_c" BETWEEN 20 AND 50),
        CONSTRAINT "CK_vital_signs_capillary_refill" CHECK ("capillary_refill_seconds" IS NULL OR "capillary_refill_seconds" BETWEEN 0 AND 60)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "anthropometric_measurements" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "consultation_id" uuid NOT NULL,
        "weight_kg" numeric(6,3),
        "length_height_cm" numeric(6,2),
        "measurement_position" "measurement_position",
        "weight_for_age_percentile" smallint,
        "weight_for_length_height_percentile" smallint,
        "length_height_for_age_percentile" smallint,
        "nutritional_diagnosis" varchar(2000),
        CONSTRAINT "PK_anthropometric_measurements" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_anthropometric_measurements_consultation" UNIQUE ("consultation_id"),
        CONSTRAINT "FK_anthropometric_measurements_consultation" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE,
        CONSTRAINT "CK_anthropometric_weight" CHECK ("weight_kg" IS NULL OR "weight_kg" BETWEEN 0 AND 500),
        CONSTRAINT "CK_anthropometric_length_height" CHECK ("length_height_cm" IS NULL OR "length_height_cm" BETWEEN 0 AND 300),
        CONSTRAINT "CK_anthropometric_position" CHECK ("length_height_cm" IS NULL OR "measurement_position" IS NOT NULL),
        CONSTRAINT "CK_anthropometric_weight_age_percentile" CHECK ("weight_for_age_percentile" IS NULL OR "weight_for_age_percentile" IN (3, 15, 50, 85, 97)),
        CONSTRAINT "CK_anthropometric_weight_length_percentile" CHECK ("weight_for_length_height_percentile" IS NULL OR "weight_for_length_height_percentile" IN (3, 15, 50, 85, 97)),
        CONSTRAINT "CK_anthropometric_length_age_percentile" CHECK ("length_height_for_age_percentile" IS NULL OR "length_height_for_age_percentile" IN (3, 15, 50, 85, 97))
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "anthropometric_measurements"`);
    await queryRunner.query(`DROP TABLE "vital_signs"`);
    await queryRunner.query(`DROP TYPE "measurement_position"`);
  }
}
