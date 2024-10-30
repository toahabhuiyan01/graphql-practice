"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
exports.initializeDatabase = initializeDatabase;
const typeorm_1 = require("typeorm");
require("reflect-metadata");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'productmanagement',
    entities: ['.build/models/*.js'],
    migrations: ['.build/migration/*.js'],
});
async function initializeDatabase() {
    if (!exports.AppDataSource.isInitialized) {
        await exports.AppDataSource.initialize();
    }
}
