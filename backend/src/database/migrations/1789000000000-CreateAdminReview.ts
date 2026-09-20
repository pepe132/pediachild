import type { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateAdminReview1789000000000 implements MigrationInterface {
  name='CreateAdminReview1789000000000';
  async up(q:QueryRunner){
    await q.query(`ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'ADMIN'`);
    await q.query(`ALTER TABLE "users" ADD COLUMN "rejected_at" timestamptz, ADD COLUMN "rejection_reason" varchar(500), ADD COLUMN "reviewed_by" uuid`);
    await q.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_reviewed_by" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL`);
    await q.query(`CREATE INDEX "IDX_users_professional_review" ON "users" ("role", "approved_at", "rejected_at", "created_at")`);
  }
  async down(q:QueryRunner){
    await q.query(`DROP INDEX "IDX_users_professional_review"`); await q.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_reviewed_by"`);
    await q.query(`ALTER TABLE "users" DROP COLUMN "reviewed_by", DROP COLUMN "rejection_reason", DROP COLUMN "rejected_at"`);
  }
}
