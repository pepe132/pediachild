import type { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateSpecialistProfiles1788750000000 implements MigrationInterface {
  name = 'CreateSpecialistProfiles1788750000000';
  async up(q: QueryRunner) {
    await q.query(`ALTER TABLE "users" ADD COLUMN "phone" varchar(20)`);
    await q.query(`CREATE UNIQUE INDEX "UQ_users_phone" ON "users" ("phone") WHERE "phone" IS NOT NULL`);
    await q.query(`CREATE TABLE "specialist_profiles" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL UNIQUE, "specialty" varchar(150) NOT NULL, "professional_license" varchar(100) NOT NULL, "specialty_license" varchar(100), "clinic_name" varchar(200), "clinic_phone" varchar(20), "clinic_address" text, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "FK_specialist_profiles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE)`);
    await q.query(`INSERT INTO "specialist_profiles" ("user_id","specialty","professional_license") SELECT "id", 'Pediatría', 'Pendiente' FROM "users"`);
  }
  async down(q: QueryRunner) { await q.query(`DROP TABLE "specialist_profiles"`); await q.query(`DROP INDEX "UQ_users_phone"`); await q.query(`ALTER TABLE "users" DROP COLUMN "phone"`); }
}
