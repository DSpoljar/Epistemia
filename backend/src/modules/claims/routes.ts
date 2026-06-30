import { FastifyInstance } from 'fastify';
import { claimRepository } from './repository';
import type { CreateClaimInput, UpdateClaimInput } from '../../types/domain';

type ListQuery  = { paperId: string };
type CreateBody = { paperId: string; text: string; notes?: string | null; type?: string | null; pageRef?: string | null };
type UpdateBody = { text?: string; notes?: string | null; type?: string | null; pageRef?: string | null };
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
    paperId:  { type: 'string' },
    text:     { type: 'string', minLength: 1 },
    notes:    { type: ['string', 'null'] },
    type:     { enum: ['hypothesis', 'limitation', 'methodology', 'implication', null] },
    pageRef:  { type: ['string', 'null'] },
  },
} as const;

const updateBodySchema = {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    text:    { type: 'string', minLength: 1 },
    notes:   { type: ['string', 'null'] },
    type:    { enum: ['hypothesis', 'limitation', 'methodology', 'implication', null] },
    pageRef: { type: ['string', 'null'] },
  },
} as const;

export async function claimRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: ListQuery }>(
    '/',
    { schema: { querystring: listQuerySchema } },
    async (request) => claimRepository.findByPaper(request.query.paperId),
  );

  app.post<{ Body: CreateBody }>(
    '/',
    { schema: { body: createBodySchema } },
    async (request, reply) => {
      const input: CreateClaimInput = {
        paperId:  request.body.paperId,
        text:     request.body.text,
        notes:    request.body.notes ?? null,
        type:     (request.body.type as CreateClaimInput['type']) ?? null,
        pageRef:  request.body.pageRef ?? null,
      };
      return reply.code(201).send(claimRepository.create(input));
    },
  );

  app.get<{ Params: IdParams }>(
    '/:id',
    { schema: { params: idParamsSchema } },
    async (request) => {
      const claim = claimRepository.findById(request.params.id);
      if (!claim) throw app.httpErrors.notFound(`Claim '${request.params.id}' not found`);
      return claim;
    },
  );

  app.patch<{ Params: IdParams; Body: UpdateBody }>(
    '/:id',
    { schema: { params: idParamsSchema, body: updateBodySchema } },
    async (request) => {
      const input: UpdateClaimInput = {
        ...request.body,
        type: request.body.type as UpdateClaimInput['type'],
      };
      const claim = claimRepository.update(request.params.id, input);
      if (!claim) throw app.httpErrors.notFound(`Claim '${request.params.id}' not found`);
      return claim;
    },
  );

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
