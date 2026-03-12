import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Todo } from '@/entities/Todo';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './data/todos.db';
const resolvedDbPath = path.resolve(process.cwd(), dbPath);

// Ensure the directory exists
const dbDir = path.dirname(resolvedDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: resolvedDbPath,
  synchronize: true,
  logging: false,
  entities: [Todo],
  migrations: [],
  subscribers: [],
});

let initialized = false;
let initializationPromise: Promise<DataSource> | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (initialized && AppDataSource.isInitialized) {
    return AppDataSource;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = AppDataSource.initialize()
    .then((ds) => {
      initialized = true;
      initializationPromise = null;
      return ds;
    })
    .catch((err) => {
      initializationPromise = null;
      throw err;
    });

  return initializationPromise;
}
