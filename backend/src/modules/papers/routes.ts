import { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { createWriteStream, createReadStream, existsSync, mkdirSync, readFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse') as (buf: Buffer) => Promise<{ info: Record<string, string>; text: string }>;
import { paperRepository } from './repository';
import type { CreatePaperInput, UpdatePaperInput } from '../../types/domain';

const PDF_DIR = join(process.cwd(), 'data', 'pdfs');
mkdirSync(PDF_DIR, { recursive: true });

type ListQuery  = { projectId: string };
type CreateBody = { projectId: string; title: string; authors?: string | null; year?: number | null; summary?: string | null; tempId?: string };
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
    tempId:    { type: 'string' },
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

interface CrossRefMessage {
  title?: string[];
  author?: { given?: string; family?: string }[];
  published?: { 'date-parts'?: number[][] };
  'published-print'?: { 'date-parts'?: number[][] };
}

async function extractMeta(buffer: Buffer): Promise<{ title: string | null; authors: string | null; year: number | null }> {
  let title: string | null = null;
  let authors: string | null = null;
  let year: number | null = null;

  try {
    const data = await pdf(buffer);

    if (data.info?.Title?.trim()) title = data.info.Title.trim();
    if (data.info?.Author?.trim()) authors = data.info.Author.trim();

    if (!title || !authors) {
      const doiMatch = data.text.match(/\b(10\.\d{4,9}\/[^\s,;]+)/);
      if (doiMatch) {
        try {
          const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doiMatch[1])}`, {
            headers: { 'User-Agent': 'Epistemia/1.0' },
            signal: AbortSignal.timeout(5000),
          });
          if (res.ok) {
            const json = await res.json() as { message: CrossRefMessage };
            const msg = json.message;
            if (!title && msg.title?.[0]) title = msg.title[0];
            if (!authors && msg.author?.length) {
              authors = msg.author.map(a => [a.family, a.given].filter(Boolean).join(', ')).join('; ');
            }
            const dateParts = msg.published?.['date-parts']?.[0] ?? msg['published-print']?.['date-parts']?.[0];
            if (dateParts?.[0]) year = dateParts[0];
          }
        } catch { /* CrossRef unavailable or timeout */ }
      }
    }
  } catch { /* pdf-parse failed */ }

  return { title, authors, year };
}

export async function paperRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/papers?projectId=xxx
  app.get<{ Querystring: ListQuery }>(
    '/',
    { schema: { querystring: listQuerySchema } },
    async (request) => paperRepository.findByProject(request.query.projectId),
  );

  // POST /api/papers/extract — upload PDF and return extracted metadata + tempId
  app.post(
    '/extract',
    async (request, reply) => {
      const data = await request.file();
      if (!data) throw app.httpErrors.badRequest('No file uploaded.');
      if (data.mimetype !== 'application/pdf') throw app.httpErrors.badRequest('Only PDF files are accepted.');

      const tempId = randomUUID();
      const tempPath = join(PDF_DIR, `temp-${tempId}.pdf`);
      await pipeline(data.file, createWriteStream(tempPath));

      const buffer = readFileSync(tempPath);
      const meta = await extractMeta(buffer);

      return reply.send({ tempId, ...meta });
    },
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
      let paper = paperRepository.create(input);

      if (request.body.tempId) {
        const tempPath = join(PDF_DIR, `temp-${request.body.tempId}.pdf`);
        const finalPath = join(PDF_DIR, `${paper.id}.pdf`);
        if (existsSync(tempPath)) {
          renameSync(tempPath, finalPath);
          paperRepository.setPdfPath(paper.id, finalPath);
          paper = { ...paper, pdfPath: finalPath };
        }
      }

      return reply.code(201).send(paper);
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

  // POST /api/papers/:id/pdf → 200 (upload PDF to existing paper)
  app.post<{ Params: IdParams }>(
    '/:id/pdf',
    { schema: { params: idParamsSchema } },
    async (request, reply) => {
      const paper = paperRepository.findById(request.params.id);
      if (!paper) throw app.httpErrors.notFound(`Paper '${request.params.id}' not found`);

      const data = await request.file();
      if (!data) throw app.httpErrors.badRequest('No file uploaded.');
      if (data.mimetype !== 'application/pdf') throw app.httpErrors.badRequest('Only PDF files are accepted.');

      const dest = join(PDF_DIR, `${request.params.id}.pdf`);
      await pipeline(data.file, createWriteStream(dest));

      paperRepository.setPdfPath(request.params.id, dest);
      return reply.send({ ...paper, pdfPath: dest });
    },
  );

  // GET /api/papers/:id/pdf → stream PDF
  app.get<{ Params: IdParams }>(
    '/:id/pdf',
    { schema: { params: idParamsSchema } },
    async (request, reply) => {
      const paper = paperRepository.findById(request.params.id);
      if (!paper) throw app.httpErrors.notFound(`Paper '${request.params.id}' not found`);
      if (!paper.pdfPath || !existsSync(paper.pdfPath)) throw app.httpErrors.notFound('No PDF attached to this paper.');

      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `inline; filename="${request.params.id}.pdf"`)
        .send(createReadStream(paper.pdfPath));
    },
  );
}
