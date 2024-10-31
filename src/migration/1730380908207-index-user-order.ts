import { MigrationInterface, QueryRunner } from "typeorm";

export class IndexUserOrder1730380908207 implements MigrationInterface {
    name = 'IndexUserOrder1730380908207'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_88991860e839c6153a7ec878d3" ON "order" ("productId") `);
        await queryRunner.query(`CREATE INDEX "IDX_caabe91507b3379c7ba73637b8" ON "order" ("userId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_caabe91507b3379c7ba73637b8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88991860e839c6153a7ec878d3"`);
    }

}
