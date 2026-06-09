import { buildApp } from './app';
import { config } from './config/env';
import { runMigrations } from './db/migrate';

async function start(): Promise<void> {
  runMigrations();

  const app = buildApp();

  try {
    await app.listen({ port: config.port, host: config.host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
