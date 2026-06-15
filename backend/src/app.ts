import Fastify, { FastifyInstance } from 'fastify';
import sensible from '@fastify/sensible';
import multipart from '@fastify/multipart';
import { projectRoutes } from './modules/projects/routes';
import { paperRoutes } from './modules/papers/routes';
import { claimRoutes } from './modules/claims/routes';
import { clusterRoutes } from './modules/clusters/routes';

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.register(sensible);
  app.register(multipart);

  app.register(projectRoutes, { prefix: '/api/projects' });
  app.register(paperRoutes,   { prefix: '/api/papers' });
  app.register(claimRoutes,   { prefix: '/api/claims' });
  app.register(clusterRoutes, { prefix: '/api/clusters' });

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}
