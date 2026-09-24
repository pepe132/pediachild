import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResetTokens1789005000000 implements MigrationInterface {
  name = 'CreatePasswordResetTokens1789005000000';

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" char(64) NOT NULL UNIQUE,
        "expires_at" timestamptz NOT NULL,
        "used_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_password_reset_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_user" ON "password_reset_tokens" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_expires" ON "password_reset_tokens" ("expires_at")`,
    );
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
  }
}
