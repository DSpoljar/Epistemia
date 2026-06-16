export const config = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  dbPath: process.env.DB_PATH || './data/epistemia.db',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@epistemia.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',
} as const;
