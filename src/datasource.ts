import { DataSource } from 'typeorm';
import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()

const uri = new URL(process.env.DB_URI!)

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: uri.hostname,
  port: +uri.port || 5432,
  username: uri.username,
  password: uri.password,
  database: uri.pathname.slice(1),
  entities: ['build/models/*.js'],
  migrations: ['build/migration/*.js'],
});

export async function initializeDatabase() {
  if(!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  return AppDataSource
}
