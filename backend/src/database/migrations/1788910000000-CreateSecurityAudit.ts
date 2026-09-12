import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSecurityAudit1788910000000 implements MigrationInterface {
  name = 'CreateSecurityAudit1788910000000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE "audit_logs" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL,
      "method" varchar(10) NOT NULL, "path" varchar(500) NOT NULL, "status_code" smallint NOT NULL,
      "ip_hash" char(64), "user_agent" varchar(500), "created_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "FK_audit_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT)`);
    await q.query(`CREATE INDEX "IDX_audit_user_created" ON "audit_logs" ("user_id", "created_at")`);
    await q.query(`CREATE FUNCTION prevent_audit_mutation() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'audit logs are immutable'; END; $$ LANGUAGE plpgsql`);
    await q.query(`CREATE TRIGGER "TR_audit_immutable" BEFORE UPDATE OR DELETE ON "audit_logs" FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation()`);
    await q.query(`CREATE TABLE "consultation_revisions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "consultation_id" uuid NOT NULL,
      "changed_by" uuid NOT NULL, "snapshot" jsonb NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "FK_revision_consultation" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_revision_user" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT)`);
    await q.query(`CREATE INDEX "IDX_revision_consultation_created" ON "consultation_revisions" ("consultation_id", "created_at")`);
    await q.query(`CREATE TRIGGER "TR_revision_immutable" BEFORE UPDATE OR DELETE ON "consultation_revisions" FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation()`);
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "consultation_revisions"`);
    await q.query(`DROP TABLE "audit_logs"`);
    await q.query(`DROP FUNCTION prevent_audit_mutation()`);
  }
}
