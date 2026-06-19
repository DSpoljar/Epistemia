import 'dotenv/config';
import { buildApp } from './app';
import { config } from './config/env';
import { runMigrations } from './db/migrate';
import { runSeed } from './db/seed';

async function start(): Promise<void> {
  runMigrations();
  runSeed();

  const app = buildApp();

  try {
    await app.listen({ port: config.port, host: config.host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
