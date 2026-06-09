import { FastifyInstance } from 'fastify';
import { projectRepository } from './repository';
import type { CreateProjectInput, UpdateProjectInput } from '../../types/domain';

// ---------------------------------------------------------------------------
// Request shapes (used for Fastify generic typing)
// ---------------------------------------------------------------------------
type CreateBody = { name: string; description?: string | null };
type UpdateBody = { name?: string; description?: string | null };
type IdParams = { id: string };

// ---------------------------------------------------------------------------
// JSON Schemas (Fastify validates request body/params before handler runs)
// ---------------------------------------------------------------------------
const idParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string' },
  },
} as const;

const createBodySchema = {
  type: 'object',
  required: ['name'],
  additionalProperties: false,
  properties: {
    name:        { type: 'string', minLength: 1 },
    description: { type: ['string', 'null'] },
  },
} as const;

const updateBodySchema = {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    name:        { type: 'string', minLength: 1 },
    description: { type: ['string', 'null'] },
  },
} as const;

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
export async function projectRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/projects
  app.get('/', async () => {
    return projectRepository.findAll();
  });

  // POST /api/projects  →  201
  app.post<{ Body: CreateBody }>(
    '/',
    { schema: { body: createBodySchema } },
    async (request, reply) => {
      const input: CreateProjectInput = {
        name:        request.body.name,
        description: request.body.description ?? null,
      };
      const project = projectRepository.create(input);
      return reply.code(201).send(project);
    },
  );

  // GET /api/projects/:id
  app.get<{ Params: IdParams }>(
    '/:id',
    { schema: { params: idParamsSchema } },
    async (request) => {
      const project = projectRepository.findById(request.params.id);
      if (!project) {
        throw app.httpErrors.notFound(`Project '${request.params.id}' not found`);
      }
      return project;
    },
  );

  // PATCH /api/projects/:id
  app.patch<{ Params: IdParams; Body: UpdateBody }>(
    '/:id',
    { schema: { params: idParamsSchema, body: updateBodySchema } },
    async (request) => {
      const input: UpdateProjectInput = request.body;
      const project = projectRepository.update(request.params.id, input);
      if (!project) {
        throw app.httpErrors.notFound(`Project '${request.params.id}' not found`);
      }
      return project;
    },
  );

  // DELETE /api/projects/:id  →  204
  app.delete<{ Params: IdParams }>(
    '/:id',
    { schema: { params: idParamsSchema } },
    async (request, reply) => {
      const deleted = projectRepository.delete(request.params.id);
      if (!deleted) {
        throw app.httpErrors.notFound(`Project '${request.params.id}' not found`);
      }
      return reply.code(204).send();
    },
  );
}
