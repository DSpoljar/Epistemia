import { FastifyInstance } from 'fastify';
import { paperRepository } from './repository';
import type { CreatePaperInput, UpdatePaperInput } from '../../types/domain';

type ListQuery  = { projectId: string };
type CreateBody = { projectId: string; title: string; authors?: string | null; year?: number | null; summary?: string | null };
type UpdateBody = { title?: string; authors?: string | null; year?: number | null; summary?: string | null };
type IdParams   = { id: string };

const idParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string' } },
} as const;

const listQuerySchema = {
  type: 'object',
  required: ['projectId'],
  properties: { projectId: { type: 'string' } },
} as const;

const createBodySchema = {
  type: 'object',
  required: ['projectId', 'title'],
  additionalProperties: false,
  properties: {
    projectId: { type: 'string' },
    title:     { type: 'string', minLength: 1 },
    authors:   { type: ['string', 'null'] },
    year:      { type: ['integer', 'null'] },
    summary:   { type: ['string', 'null'] },
  },
} as const;

const updateBodySchema = {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    title:   { type: 'string', minLength: 1 },
    authors: { type: ['string', 'null'] },
    year:    { type: ['integer', 'null'] },
    summary: { type: ['string', 'null'] },
  },
} as const;

export async function paperRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/papers?projectId=xxx
  app.get<{ Querystring: ListQuery }>(
    '/',
    { schema: { querystring: listQuerySchema } },
    async (request) => paperRepository.findByProject(request.query.projectId),
  );

  // POST /api/papers → 201
  app.post<{ Body: CreateBody }>(
    '/',
    { schema: { body: createBodySchema } },
    async (request, reply) => {
      const input: CreatePaperInput = {
        projectId: request.body.projectId,
        title:     request.body.title,
        authors:   request.body.authors ?? null,
        year:      request.body.year ?? null,
        summary:   request.body.summary ?? null,
      };
      return reply.code(201).send(paperRepository.create(input));
    },
  );

  // GET /api/papers/:id
  app.get<{ Params: IdParams }>(
    '/:id',
    { schema: { params: idParamsSchema } },
    async (request) => {
      const paper = paperRepository.findById(request.params.id);
      if (!paper) throw app.httpErrors.notFound(`Paper '${request.params.id}' not found`);
      return paper;
    },
  );

  // PATCH /api/papers/:id
  app.patch<{ Params: IdParams; Body: UpdateBody }>(
    '/:id',
    { schema: { params: idParamsSchema, body: updateBodySchema } },
    async (request) => {
      const input: UpdatePaperInput = request.body;
      const paper = paperRepository.update(request.params.id, input);
      if (!paper) throw app.httpErrors.notFound(`Paper '${request.params.id}' not found`);
      return paper;
    },
  );

  // DELETE /api/papers/:id → 204
  app.delete<{ Params: IdParams }>(
    '/:id',
    { schema: { params: idParamsSchema } },
    async (request, reply) => {
      const deleted = paperRepository.delete(request.params.id);
      if (!deleted) throw app.httpErrors.notFound(`Paper '${request.params.id}' not found`);
      return reply.code(204).send();
    },
  );
}
