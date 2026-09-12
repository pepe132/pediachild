import type { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateClinicalHistoryRevisions1788915000000 implements MigrationInterface {
  name='CreateClinicalHistoryRevisions1788915000000';
  async up(q:QueryRunner){
    await q.query(`CREATE TABLE IF NOT EXISTS "clinical_history_revisions" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "clinical_history_id" uuid NOT NULL, "changed_by" uuid NOT NULL, "snapshot" jsonb NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "FK_history_revision_history" FOREIGN KEY ("clinical_history_id") REFERENCES "clinical_histories"("id") ON DELETE RESTRICT, CONSTRAINT "FK_history_revision_user" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT)`);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_history_revision_created" ON "clinical_history_revisions" ("clinical_history_id", "created_at")`);
    await q.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='TR_history_revision_immutable') THEN CREATE TRIGGER "TR_history_revision_immutable" BEFORE UPDATE OR DELETE ON "clinical_history_revisions" FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation(); END IF; END $$`);
  }
  async down(q:QueryRunner){await q.query(`DROP TABLE "clinical_history_revisions"`);}
}
