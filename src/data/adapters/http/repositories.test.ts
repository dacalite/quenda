// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RuleViolationError,
  ValidationError,
} from '../../ports/errors';
import { createHttpRepositories } from './repositories';

interface Call {
  url: string;
  method: string;
  headers: Headers;
  body: unknown;
  raw: unknown;
}

function setup(respond: (call: Call) => Response = () => Response.json({})) {
  const calls: Call[] = [];
  const repos = createHttpRepositories({
    baseUrl: 'https://reservas.example.org/api/v1/',
    token: () => 'token-123',
    fetch: (input, init) => {
      const call = {
        url: input instanceof Request ? input.url : input.toString(),
        method: init?.method ?? 'GET',
        headers: new Headers(init?.headers),
        body: typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined,
        raw: init?.body,
      };
      calls.push(call);
      return Promise.resolve(respond(call));
    },
  });
  return { repos, calls };
}

const problem = (status: number, extra: object = {}) =>
  Response.json(
    { type: 'about:blank', title: 'Problem', status, ...extra },
    { status, headers: { 'content-type': 'application/problem+json' } },
  );

describe('createHttpRepositories', () => {
  it('sends the session token and reads JSON bodies', async () => {
    const { repos, calls } = setup(() => Response.json([{ id: 'bouzalonga' }]));
    await expect(repos.tenants.list()).resolves.toEqual([{ id: 'bouzalonga' }]);
    expect(calls[0]?.url).toBe('https://reservas.example.org/api/v1/tenants');
    expect(calls[0]?.headers.get('authorization')).toBe('Bearer token-123');
    expect(calls[0]?.headers.get('accept')).toBe('application/json');
  });

  it('uploads photos as multipart form data', async () => {
    const { repos, calls } = setup(() =>
      Response.json({ url: 'https://ficheiros.example.org/foto.jpg' }, { status: 201 }),
    );
    const image = new Blob(['jpeg'], { type: 'image/jpeg' });
    await expect(repos.facilities.uploadPhoto('t1', image)).resolves.toEqual({
      url: 'https://ficheiros.example.org/foto.jpg',
    });
    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.url).toBe('https://reservas.example.org/api/v1/tenants/t1/photos');
    expect(calls[0]?.headers.get('content-type')).toBeNull();
    expect((calls[0]?.raw as FormData).get('file')).toBeInstanceOf(Blob);
  });

  it('maps every port call to its resource, scoped by tenant', async () => {
    const { repos, calls } = setup();
    await repos.reservations.list('t1', {
      facilityId: 'f1',
      holder: { kind: 'user', userId: 'u1' },
      from: '2026-10-01',
      status: ['confirmed', 'noShow'],
    });
    await repos.reservations.cancel('t1', 'r 1');
    await repos.facilities.availability('t1', 'f1', '2026-10-20');
    await repos.schedules.createBlock('t1', {
      facilityId: 'f1',
      subspaceId: null,
      dates: { from: '2026-10-20', to: '2026-10-21' },
      times: { start: '09:00', end: '14:00' },
      reason: 'maintenance',
      note: '',
    });
    await repos.users.update('t1', 'u1', { phone: '600' });
    await repos.deputacions.indicators('d1', { from: '2026-09-01', to: '2026-09-30' });

    expect(
      calls.map((c) => `${c.method} ${c.url.replace('https://reservas.example.org/api/v1', '')}`),
    ).toEqual([
      'GET /tenants/t1/reservations?facilityId=f1&from=2026-10-01&status=confirmed%2CnoShow&holder=user%3Au1',
      'POST /tenants/t1/reservations/r%201/cancel',
      'GET /tenants/t1/facilities/f1/availability?date=2026-10-20',
      'POST /tenants/t1/blocks',
      'PATCH /tenants/t1/users/u1',
      'GET /deputacions/d1/indicators?from=2026-09-01&to=2026-09-30',
    ]);
    expect(calls[3]?.body).toMatchObject({ facilityId: 'f1', reason: 'maintenance' });
    expect(calls[3]?.headers.get('content-type')).toBe('application/json');
    expect(calls[4]?.body).toEqual({ phone: '600' });
  });

  it('resolves to nothing for empty responses', async () => {
    const { repos } = setup(() => new Response(null, { status: 204 }));
    await expect(repos.schedules.deleteHoliday('t1', 'h1')).resolves.toBeUndefined();
  });

  it('turns problem responses into the typed errors of the ports', async () => {
    const cases: [Response, new (...args: never[]) => Error][] = [
      [problem(400, { problems: [{ field: 'name', code: 'required' }] }), ValidationError],
      [problem(403), ForbiddenError],
      [problem(404, { resource: 'reservation', id: 'r1' }), NotFoundError],
      [problem(409), ConflictError],
      [problem(422, { violations: [{ code: 'past' }] }), RuleViolationError],
    ];
    for (const [response, type] of cases) {
      const { repos } = setup(() => response);
      await expect(repos.reservations.get('t1', 'r1')).rejects.toBeInstanceOf(type);
    }

    const { repos } = setup(() =>
      problem(400, { problems: [{ field: 'name', code: 'required' }] }),
    );
    const error: unknown = await repos.tenants.update('t1', { name: '' }).catch((e: unknown) => e);
    expect((error as ValidationError).problems).toEqual([{ field: 'name', code: 'required' }]);
  });

  it('reports other failures as plain errors with the status', async () => {
    const { repos } = setup(() => new Response('oops', { status: 503 }));
    await expect(repos.tenants.list()).rejects.toThrow('503');
  });
});
