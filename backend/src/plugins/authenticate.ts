import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    await reply.status(401).send({ error: 'Unauthorized' });
    return;
  }
  const token = header.slice(7);
  try {
    jwt.verify(token, config.jwtSecret);
  } catch {
    await reply.status(401).send({ error: 'Invalid or expired token' });
  }
}
