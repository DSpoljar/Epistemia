import Fastify, { FastifyInstance } from 'fastify';
import sensible from '@fastify/sensible';
import multipart from '@fastify/multipart';
import { projectRoutes } from './modules/projects/routes';
import { paperRoutes } from './modules/papers/routes';
import { claimRoutes } from './modules/claims/routes';
import { clusterRoutes } from './modules/clusters/routes';
import { authRoutes } from './modules/auth/routes';
import { authenticate } from './plugins/authenticate';

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.register(sensible);
  app.register(multipart);

  app.register(authRoutes, { prefix: '/api/auth' });

  app.addHook('preHandler', async (req, reply) => {
    if (req.url.startsWith('/api/auth') || req.url === '/health') return;
    await authenticate(req, reply);
  });

  app.register(projectRoutes, { prefix: '/api/projects' });
  app.register(paperRoutes,   { prefix: '/api/papers' });
  app.register(claimRoutes,   { prefix: '/api/claims' });
  app.register(clusterRoutes, { prefix: '/api/clusters' });

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV }));

  return app;
}
