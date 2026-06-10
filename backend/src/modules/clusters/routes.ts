import { FastifyInstance } from 'fastify';
import { clusterRepository } from './repository';
import { claimRepository } from '../claims/repository';
import type { CreateClusterInput, UpdateClusterInput } from '../../types/domain';

type ListQuery     = { projectId: string };
type CreateBody    = { projectId: string; name: string; description?: string | null };
type UpdateBody    = { name?: string; description?: string | null };
type IdParams      = { id: string };
type ClusterParams = { clusterId: string };
type ClaimParams   = { clusterId: string; claimId: string };
type AssignBody    = { claimId: string };

const idParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string' } },
} as const;

const clusterParamsSchema = {
  type: 'object',
  required: ['clusterId'],
  properties: { clusterId: { type: 'string' } },
} as const;

const claimParamsSchema = {
  type: 'object',
  required: ['clusterId', 'claimId'],
  properties: { clusterId: { type: 'string' }, claimId: { type: 'string' } },
} as const;

const listQuerySchema = {
  type: 'object',
  required: ['projectId'],
  properties: { projectId: { type: 'string' } },
} as const;

const createBodySchema = {
  type: 'object',
  required: ['projectId', 'name'],
  additionalProperties: false,
  properties: {
    projectId:   { type: 'string' },
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

const assignBodySchema = {
  type: 'object',
  required: ['claimId'],
  additionalProperties: false,
  properties: {
    claimId: { type: 'string' },
  },
} as const;

export async function clusterRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/clusters?projectId=xxx
  app.get<{ Querystring: ListQuery }>(
    '/',
    { schema: { querystring: listQuerySchema } },
    async (request) => clusterRepository.findByProject(request.query.projectId),
  );

  // POST /api/clusters → 201
  app.post<{ Body: CreateBody }>(
    '/',
    { schema: { body: createBodySchema } },
    async (request, reply) => {
      const input: CreateClusterInput = {
        projectId:   request.body.projectId,
        name:        request.body.name,
        description: request.body.description ?? null,
      };
      return reply.code(201).send(clusterRepository.create(input));
    },
  );

  // GET /api/clusters/:id
  app.get<{ Params: IdParams }>(
    '/:id',
    { schema: { params: idParamsSchema } },
    async (request) => {
      const cluster = clusterRepository.findById(request.params.id);
      if (!cluster) throw app.httpErrors.notFound(`Cluster '${request.params.id}' not found`);
      return cluster;
    },
  );

  // PATCH /api/clusters/:id
  app.patch<{ Params: IdParams; Body: UpdateBody }>(
    '/:id',
    { schema: { params: idParamsSchema, body: updateBodySchema } },
    async (request) => {
      const input: UpdateClusterInput = request.body;
      const cluster = clusterRepository.update(request.params.id, input);
      if (!cluster) throw app.httpErrors.notFound(`Cluster '${request.params.id}' not found`);
      return cluster;
    },
  );

  // GET /api/clusters/:id/comparison
  app.get<{ Params: IdParams }>(
    '/:id/comparison',
    { schema: { params: idParamsSchema } },
    async (request) => {
      const { id } = request.params;
      const cluster = clusterRepository.findById(id);
      if (!cluster) throw app.httpErrors.notFound(`Cluster '${id}' not found`);
      const { claims, papers } = clusterRepository.findComparison(id);
      return { cluster, claims, papers };
    },
  );

  // DELETE /api/clusters/:id → 204
  app.delete<{ Params: IdParams }>(
    '/:id',
    { schema: { params: idParamsSchema } },
    async (request, reply) => {
      const deleted = clusterRepository.delete(request.params.id);
      if (!deleted) throw app.httpErrors.notFound(`Cluster '${request.params.id}' not found`);
      return reply.code(204).send();
    },
  );

  // GET /api/clusters/:clusterId/claims
  app.get<{ Params: ClusterParams }>(
    '/:clusterId/claims',
    { schema: { params: clusterParamsSchema } },
    async (request) => {
      const { clusterId } = request.params;
      const cluster = clusterRepository.findById(clusterId);
      if (!cluster) throw app.httpErrors.notFound(`Cluster '${clusterId}' not found`);
      return clusterRepository.findClaims(clusterId);
    },
  );

  // POST /api/clusters/:clusterId/claims → 201
  app.post<{ Params: ClusterParams; Body: AssignBody }>(
    '/:clusterId/claims',
    { schema: { params: clusterParamsSchema, body: assignBodySchema } },
    async (request, reply) => {
      const { clusterId } = request.params;
      const { claimId }   = request.body;

      const cluster = clusterRepository.findById(clusterId);
      if (!cluster) throw app.httpErrors.notFound(`Cluster '${clusterId}' not found`);

      const claim = claimRepository.findById(claimId);
      if (!claim) throw app.httpErrors.notFound(`Claim '${claimId}' not found`);

      if (clusterRepository.hasClaim(clusterId, claimId)) {
        throw app.httpErrors.conflict(`Claim '${claimId}' is already assigned to this cluster`);
      }

      clusterRepository.addClaim(clusterId, claimId);
      return reply.code(201).send(claim);
    },
  );

  // DELETE /api/clusters/:clusterId/claims/:claimId → 204
  app.delete<{ Params: ClaimParams }>(
    '/:clusterId/claims/:claimId',
    { schema: { params: claimParamsSchema } },
    async (request, reply) => {
      const { clusterId, claimId } = request.params;

      const cluster = clusterRepository.findById(clusterId);
      if (!cluster) throw app.httpErrors.notFound(`Cluster '${clusterId}' not found`);

      const removed = clusterRepository.removeClaim(clusterId, claimId);
      if (!removed) throw app.httpErrors.notFound(`Claim '${claimId}' is not assigned to this cluster`);

      return reply.code(204).send();
    },
  );
}
