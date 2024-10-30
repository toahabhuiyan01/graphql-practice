import { DataSource } from 'typeorm';
import 'reflect-metadata'

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'productmanagement',
  entities: ['.build/models/*.js'],
  migrations: ['.build/migration/*.js'],
});

export async function initializeDatabase() {
  if(!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }
}
