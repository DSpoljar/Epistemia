import { FastifyInstance } from 'fastify';
import { claimRepository } from './repository';
import type { CreateClaimInput, UpdateClaimInput } from '../../types/domain';

type ListQuery  = { paperId: string };
type CreateBody = { paperId: string; text: string; notes?: string | null };
type UpdateBody = { text?: string; notes?: string | null };
type IdParams   = { id: string };

const idParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string' } },
} as const;

const listQuerySchema = {
  type: 'object',
  required: ['paperId'],
  properties: { paperId: { type: 'string' } },
} as const;

const createBodySchema = {
  type: 'object',
  required: ['paperId', 'text'],
  additionalProperties: false,
  properties: {
    paperId: { type: 'string' },
    text:    { type: 'string', minLength: 1 },
    notes:   { type: ['string', 'null'] },
  },
} as const;

const updateBodySchema = {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    text:  { type: 'string', minLength: 1 },
    notes: { type: ['string', 'null'] },
  },
} as const;

export async function claimRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/claims?paperId=xxx
  app.get<{ Querystring: ListQuery }>(
    '/',
    { schema: { querystring: listQuerySchema } },
    async (request) => claimRepository.findByPaper(request.query.paperId),
  );

  // POST /api/claims → 201
  app.post<{ Body: CreateBody }>(
    '/',
    { schema: { body: createBodySchema } },
    async (request, reply) => {
      const input: CreateClaimInput = {
        paperId: request.body.paperId,
        text:    request.body.text,
        notes:   request.body.notes ?? null,
      };
      return reply.code(201).send(claimRepository.create(input));
    },
  );

  // GET /api/claims/:id
  app.get<{ Params: IdParams }>(
    '/:id',
    { schema: { params: idParamsSchema } },
    async (request) => {
      const claim = claimRepository.findById(request.params.id);
      if (!claim) throw app.httpErrors.notFound(`Claim '${request.params.id}' not found`);
      return claim;
    },
  );

  // PATCH /api/claims/:id
  app.patch<{ Params: IdParams; Body: UpdateBody }>(
    '/:id',
    { schema: { params: idParamsSchema, body: updateBodySchema } },
    async (request) => {
      const input: UpdateClaimInput = request.body;
      const claim = claimRepository.update(request.params.id, input);
      if (!claim) throw app.httpErrors.notFound(`Claim '${request.params.id}' not found`);
      return claim;
    },
  );

  // DELETE /api/claims/:id → 204
  app.delete<{ Params: IdParams }>(
    '/:id',
    { schema: { params: idParamsSchema } },
    async (request, reply) => {
      const deleted = claimRepository.delete(request.params.id);
      if (!deleted) throw app.httpErrors.notFound(`Claim '${request.params.id}' not found`);
      return reply.code(204).send();
    },
  );
}
