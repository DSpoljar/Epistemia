import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isAuthenticated, getToken, setToken, clearToken } from './client';

function makeToken(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fakesig`;
}

describe('isAuthenticated', () => {
  beforeEach(() => clearToken());
  afterEach(() => clearToken());

  it('returns false when no token is stored', () => {
    expect(isAuthenticated()).toBe(false);
  });

  it('returns false when token is malformed (wrong number of parts)', () => {
    setToken('not-a-jwt-at-all');
    expect(isAuthenticated()).toBe(false);
  });

  it('returns false and clears the token when exp is in the past', () => {
    const exp = Math.floor(Date.now() / 1000) - 60;
    setToken(makeToken({ userId: '1', email: 'test@test.com', exp }));
    expect(isAuthenticated()).toBe(false);
    expect(getToken()).toBeNull();
  });

  it('returns true when exp is in the future', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    setToken(makeToken({ userId: '1', email: 'test@test.com', exp }));
    expect(isAuthenticated()).toBe(true);
  });

  it('returns false when token has no exp claim', () => {
    setToken(makeToken({ userId: '1', email: 'test@test.com' }));
    expect(isAuthenticated()).toBe(false);
  });
});
