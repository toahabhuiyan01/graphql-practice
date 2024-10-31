"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
exports.initializeDatabase = initializeDatabase;
const typeorm_1 = require("typeorm");
require("reflect-metadata");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const uri = new URL(process.env.DB_URI);
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: uri.hostname,
    port: +uri.port || 5432,
    username: uri.username,
    password: uri.password,
    database: uri.pathname.slice(1),
    entities: ['.build/models/*.js'],
    migrations: ['.build/migration/*.js'],
});
async function initializeDatabase() {
    if (!exports.AppDataSource.isInitialized) {
        await exports.AppDataSource.initialize();
    }
}
