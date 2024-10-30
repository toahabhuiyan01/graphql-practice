"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderStatus1730307582194 = void 0;
class OrderStatus1730307582194 {
    name = 'OrderStatus1730307582194';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "order" ADD "status" character varying NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "status"`);
    }
}
exports.OrderStatus1730307582194 = OrderStatus1730307582194;
