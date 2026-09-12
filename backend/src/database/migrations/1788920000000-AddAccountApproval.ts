import type { MigrationInterface, QueryRunner } from 'typeorm';
export class AddAccountApproval1788920000000 implements MigrationInterface {
  name='AddAccountApproval1788920000000';
  async up(q:QueryRunner){await q.query(`ALTER TABLE "users" ADD COLUMN "approved_at" timestamptz`);await q.query(`UPDATE "users" SET "approved_at"=now() WHERE "active"=true`);}
  async down(q:QueryRunner){await q.query(`ALTER TABLE "users" DROP COLUMN "approved_at"`);}
}
