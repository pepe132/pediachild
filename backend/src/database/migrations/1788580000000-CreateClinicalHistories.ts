import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClinicalHistories1788580000000 implements MigrationInterface {
  name = 'CreateClinicalHistories1788580000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TYPE "immunization_status" AS ENUM ('COMPLETE','INCOMPLETE','UNKNOWN')`);
    await q.query(`CREATE TYPE "family_relationship" AS ENUM ('MOTHER','FATHER')`);
    await q.query(`CREATE TYPE "food_type" AS ENUM ('RED_MEAT','CHICKEN','EGG','MILK','FISH','CEREALS','TORTILLA','LEGUMES','VEGETABLES','FRUITS','SODA','BREAD')`);
    await q.query(`CREATE TYPE "pathological_category" AS ENUM ('ALLERGY','SURGERY','TRAUMA','EXANTHEMATIC_DISEASE','HOSPITALIZATION')`);
    await q.query(`CREATE TYPE "clinical_presence_status" AS ENUM ('DENIED','PRESENT','UNKNOWN')`);
    await q.query(`CREATE TABLE "clinical_histories" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "patient_id" uuid NOT NULL UNIQUE,
      "informant_name" varchar(200), "informant_relationship" varchar(100), "siblings_history" text,
      "grandparents_history" text, "neurodevelopment_notes" text, "schooling_notes" text,
      "immunization_status" "immunization_status" NOT NULL DEFAULT 'UNKNOWN', "missing_vaccines" text,
      "immunization_notes" text, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "FK_clinical_histories_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE,
      CONSTRAINT "CK_clinical_histories_vaccines" CHECK ("immunization_status" = 'INCOMPLETE' OR "missing_vaccines" IS NULL)
    )`);
    await q.query(`CREATE TABLE "family_member_histories" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "clinical_history_id" uuid NOT NULL, "relationship" "family_relationship" NOT NULL,
      "age" smallint, "origin" varchar(300), "residence" varchar(300), "schooling" varchar(200), "language" varchar(100),
      "occupation" varchar(200), "religion" varchar(150), "substance_use" text, "tattoos_piercings" text,
      "comorbidities" text, "blood_type" varchar(20),
      CONSTRAINT "UQ_family_member_history_relationship" UNIQUE ("clinical_history_id","relationship"),
      CONSTRAINT "FK_family_member_history" FOREIGN KEY ("clinical_history_id") REFERENCES "clinical_histories"("id") ON DELETE CASCADE,
      CONSTRAINT "CK_family_member_age" CHECK ("age" IS NULL OR "age" BETWEEN 0 AND 130)
    )`);
    await q.query(`CREATE TABLE "non_pathological_histories" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "clinical_history_id" uuid NOT NULL UNIQUE, "origin" varchar(300), "residence" varchar(300),
      "housing_notes" text, "services_notes" text, "cooking_fuel_notes" text, "water_notes" text, "bathroom_notes" text,
      "cohabitants_notes" text, "room_notes" text, "animal_contact_notes" text, "biomass_exposure_notes" text,
      "bathing_notes" text, "clothing_change_notes" text, "tooth_brushings_per_day" smallint, "urination_notes" text,
      "bowel_movements_per_day" numeric(4,1), "bristol_type" smallint,
      CONSTRAINT "FK_non_pathological_history" FOREIGN KEY ("clinical_history_id") REFERENCES "clinical_histories"("id") ON DELETE CASCADE,
      CONSTRAINT "CK_tooth_brushings" CHECK ("tooth_brushings_per_day" IS NULL OR "tooth_brushings_per_day" BETWEEN 0 AND 20),
      CONSTRAINT "CK_bowel_movements" CHECK ("bowel_movements_per_day" IS NULL OR "bowel_movements_per_day" BETWEEN 0 AND 50),
      CONSTRAINT "CK_bristol_type" CHECK ("bristol_type" IS NULL OR "bristol_type" BETWEEN 1 AND 7)
    )`);
    await q.query(`CREATE TABLE "nutrition_histories" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "clinical_history_id" uuid NOT NULL UNIQUE,
      "exclusive_breastfeeding_notes" text, "complementary_feeding_notes" text, "family_diet_notes" text,
      "meals_per_day" smallint, "twenty_four_hour_recall" text,
      CONSTRAINT "FK_nutrition_history" FOREIGN KEY ("clinical_history_id") REFERENCES "clinical_histories"("id") ON DELETE CASCADE,
      CONSTRAINT "CK_meals_per_day" CHECK ("meals_per_day" IS NULL OR "meals_per_day" BETWEEN 0 AND 20)
    )`);
    await q.query(`CREATE TABLE "food_frequencies" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "clinical_history_id" uuid NOT NULL, "food_type" "food_type" NOT NULL, "days_per_week" smallint NOT NULL,
      CONSTRAINT "UQ_food_frequency_type" UNIQUE ("clinical_history_id","food_type"),
      CONSTRAINT "FK_food_frequency" FOREIGN KEY ("clinical_history_id") REFERENCES "clinical_histories"("id") ON DELETE CASCADE,
      CONSTRAINT "CK_food_frequency_days" CHECK ("days_per_week" BETWEEN 0 AND 7)
    )`);
    await q.query(`CREATE TABLE "perinatal_histories" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "clinical_history_id" uuid NOT NULL UNIQUE,
      "maternal_age_at_pregnancy" smallint, "pregnancies" smallint, "births" smallint, "cesareans" smallint, "abortions" smallint,
      "pregnancy_number" smallint, "pregnancy_planned" boolean, "pregnancy_desired" boolean, "pregnancy_notes" text,
      "prenatal_visits" smallint, "ultrasound_notes" text, "maternal_vaccines_notes" text, "maternal_conditions_notes" text,
      "birth_route" varchar(200), "birth_place" varchar(300), "gestational_age_weeks" smallint, "gestational_age_days" smallint,
      "birth_weight_grams" integer, "birth_length_cm" numeric(5,2), "apgar" varchar(100), "cried_and_breathed_at_birth" boolean,
      "metabolic_screening_notes" text, "hearing_screening_notes" text, "cardiac_screening_notes" text, "perinatal_hospitalization_notes" text,
      CONSTRAINT "FK_perinatal_history" FOREIGN KEY ("clinical_history_id") REFERENCES "clinical_histories"("id") ON DELETE CASCADE,
      CONSTRAINT "CK_gestational_days" CHECK ("gestational_age_days" IS NULL OR "gestational_age_days" BETWEEN 0 AND 6),
      CONSTRAINT "CK_perinatal_nonnegative" CHECK (COALESCE("pregnancies",0)>=0 AND COALESCE("births",0)>=0 AND COALESCE("cesareans",0)>=0 AND COALESCE("abortions",0)>=0 AND COALESCE("prenatal_visits",0)>=0)
    )`);
    await q.query(`CREATE TABLE "pathological_history_items" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "clinical_history_id" uuid NOT NULL,
      "category" "pathological_category" NOT NULL, "status" "clinical_presence_status" NOT NULL, "description" text,
      CONSTRAINT "UQ_pathological_history_category" UNIQUE ("clinical_history_id","category"),
      CONSTRAINT "FK_pathological_history_item" FOREIGN KEY ("clinical_history_id") REFERENCES "clinical_histories"("id") ON DELETE CASCADE,
      CONSTRAINT "CK_pathological_description" CHECK ("status" <> 'PRESENT' OR NULLIF(BTRIM("description"),'') IS NOT NULL)
    )`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "pathological_history_items"`); await q.query(`DROP TABLE "perinatal_histories"`);
    await q.query(`DROP TABLE "food_frequencies"`); await q.query(`DROP TABLE "nutrition_histories"`);
    await q.query(`DROP TABLE "non_pathological_histories"`); await q.query(`DROP TABLE "family_member_histories"`);
    await q.query(`DROP TABLE "clinical_histories"`); await q.query(`DROP TYPE "clinical_presence_status"`);
    await q.query(`DROP TYPE "pathological_category"`); await q.query(`DROP TYPE "food_type"`);
    await q.query(`DROP TYPE "family_relationship"`); await q.query(`DROP TYPE "immunization_status"`);
  }
}
