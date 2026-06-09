export const config = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  dbPath: process.env.DB_PATH || './data/epistemia.db',
} as const;
