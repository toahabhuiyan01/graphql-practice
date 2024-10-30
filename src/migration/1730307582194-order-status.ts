import { MigrationInterface, QueryRunner } from "typeorm";

export class OrderStatus1730307582194 implements MigrationInterface {
    name = 'OrderStatus1730307582194'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" ADD "status" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "status"`);
    }

}
