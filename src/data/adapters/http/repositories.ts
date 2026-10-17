// SPDX-License-Identifier: EUPL-1.2
import type { FieldProblem } from '../../../domain/validation';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RuleViolationError,
  ValidationError,
} from '../../ports/errors';
import type { Repositories } from '../../ports/repositories';

// The same contract over the REST API described in docs/api/openapi.yaml. The prototype does not
// use it: it shows that replacing the local adapter leaves the screens untouched.

export interface HttpAdapterOptions {
  /** Root of the API, e.g. `https://reservas.example.org/api/v1/`. */
  baseUrl: string;
  /** Access token from the identity provider (OIDC), `null` for anonymous visitors. */
  token: () => string | null;
  fetch?: typeof fetch;
}

type Query = Record<string, string | string[] | undefined>;

interface Problem {
  title?: string;
  problems?: FieldProblem[];
  violations?: ConstructorParameters<typeof RuleViolationError>[0];
  resource?: string;
  id?: string;
}

const segment = (value: string) => encodeURIComponent(value);

function toError(status: number, problem: Problem): Error {
  switch (status) {
    case 400:
      return new ValidationError(problem.problems ?? []);
    case 403:
      return new ForbiddenError(problem.title);
    case 404:
      return new NotFoundError(problem.resource ?? 'resource', problem.id ?? '');
    case 409:
      return new ConflictError(problem.title);
    case 422:
      return new RuleViolationError(problem.violations ?? []);
    default:
      return new Error(`Request failed with status ${String(status)}`);
  }
}

export function createHttpRepositories({
  baseUrl,
  token,
  fetch: send = globalThis.fetch,
}: HttpAdapterOptions): Repositories {
  const root = baseUrl.replace(/\/$/, '');

  const request = async <T>(
    method: string,
    path: string,
    { query, body }: { query?: Query; body?: unknown } = {},
  ): Promise<T> => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) search.set(key, Array.isArray(value) ? value.join(',') : value);
    }
    const headers = new Headers({ accept: 'application/json' });
    const bearer = token();
    if (bearer) headers.set('authorization', `Bearer ${bearer}`);
    // Files go as multipart: the browser sets that content type with its boundary.
    const form = body instanceof FormData;
    if (body !== undefined && !form) headers.set('content-type', 'application/json');

    const response = await send(`${root}${path}${search.size > 0 ? `?${search}` : ''}`, {
      method,
      headers,
      ...(body !== undefined ? { body: form ? body : JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      const problem = (await response.json().catch(() => ({}))) as Problem;
      throw toError(response.status, problem);
    }
    return (response.status === 204 ? undefined : await response.json()) as T;
  };

  const get = <T>(path: string, query?: Query) => request<T>('GET', path, { query });
  const post = <T>(path: string, body?: unknown) => request<T>('POST', path, { body });
  const patch = <T>(path: string, body: unknown) => request<T>('PATCH', path, { body });
  const put = <T>(path: string, body: unknown) => request<T>('PUT', path, { body });
  const remove = (path: string) => request<undefined>('DELETE', path);

  const tenant = (tenantId: string) => `/tenants/${segment(tenantId)}`;
  const facility = (tenantId: string, id: string) =>
    `${tenant(tenantId)}/facilities/${segment(id)}`;
  const reservation = (tenantId: string, id: string) =>
    `${tenant(tenantId)}/reservations/${segment(id)}`;
  const deputacion = (id: string) => `/deputacions/${segment(id)}`;

  return {
    tenants: {
      list: () => get('/tenants'),
      getBySlug: (slug) => get(`/sites/${segment(slug)}`),
      update: (tenantId, changes) => patch(tenant(tenantId), changes),
    },
    facilities: {
      list: (tenantId) => get(`${tenant(tenantId)}/facilities`),
      get: (tenantId, id) => get(facility(tenantId, id)),
      create: (tenantId, input) => post(`${tenant(tenantId)}/facilities`, input),
      update: (tenantId, id, changes) => patch(facility(tenantId, id), changes),
      uploadPhoto: (tenantId, image) => {
        const body = new FormData();
        body.set('file', image);
        return post(`${tenant(tenantId)}/photos`, body);
      },
      availability: (tenantId, id, date) => get(`${facility(tenantId, id)}/availability`, { date }),
      recommendations: (tenantId, id, date) =>
        get(`${facility(tenantId, id)}/recommendations`, { date }),
    },
    schedules: {
      get: (tenantId, facilityId) => get(`${facility(tenantId, facilityId)}/schedule`),
      save: (tenantId, schedule) =>
        put(`${facility(tenantId, schedule.facilityId)}/schedule`, schedule),
      listHolidays: (tenantId) => get(`${tenant(tenantId)}/holidays`),
      createHoliday: (tenantId, input) => post(`${tenant(tenantId)}/holidays`, input),
      deleteHoliday: (tenantId, id) => remove(`${tenant(tenantId)}/holidays/${segment(id)}`),
      listBlocks: (tenantId, filter = {}) => get(`${tenant(tenantId)}/blocks`, { ...filter }),
      previewBlock: (tenantId, input) => post(`${tenant(tenantId)}/blocks/preview`, input),
      createBlock: (tenantId, input) => post(`${tenant(tenantId)}/blocks`, input),
      deleteBlock: (tenantId, id) => remove(`${tenant(tenantId)}/blocks/${segment(id)}`),
    },
    reservations: {
      list: (tenantId, { holder, ...filter } = {}) =>
        get(`${tenant(tenantId)}/reservations`, {
          ...filter,
          holder:
            holder &&
            (holder.kind === 'user' ? `user:${holder.userId}` : `entity:${holder.entityId}`),
        }),
      get: (tenantId, id) => get(reservation(tenantId, id)),
      getByCode: (tenantId, code) => get(`${tenant(tenantId)}/reservation-codes/${segment(code)}`),
      quote: (tenantId, input, replaces) =>
        post(`${tenant(tenantId)}/reservations/quote`, { ...input, replaces }),
      create: (tenantId, input) => post(`${tenant(tenantId)}/reservations`, input),
      reschedule: (tenantId, id, slot) => post(`${reservation(tenantId, id)}/reschedule`, slot),
      cancel: (tenantId, id) => post(`${reservation(tenantId, id)}/cancel`),
      checkIn: (tenantId, id) => post(`${reservation(tenantId, id)}/check-in`),
      markNoShow: (tenantId, id) => post(`${reservation(tenantId, id)}/no-show`),
    },
    recurringBookings: {
      list: (tenantId, filter = {}) => get(`${tenant(tenantId)}/recurring-bookings`, { ...filter }),
      preview: (tenantId, input) => post(`${tenant(tenantId)}/recurring-bookings/preview`, input),
      create: (tenantId, input) => post(`${tenant(tenantId)}/recurring-bookings`, input),
    },
    users: {
      list: (tenantId, filter = {}) => get(`${tenant(tenantId)}/users`, { ...filter }),
      get: (tenantId, id) => get(`${tenant(tenantId)}/users/${segment(id)}`),
      create: (tenantId, input) => post(`${tenant(tenantId)}/users`, input),
      update: (tenantId, id, changes) => patch(`${tenant(tenantId)}/users/${segment(id)}`, changes),
    },
    entities: {
      list: (tenantId) => get(`${tenant(tenantId)}/entities`),
      get: (tenantId, id) => get(`${tenant(tenantId)}/entities/${segment(id)}`),
    },
    notifications: {
      list: (tenantId, userId) => get(`${tenant(tenantId)}/users/${segment(userId)}/notifications`),
      markRead: (tenantId, id) => post(`${tenant(tenantId)}/notifications/${segment(id)}/read`),
    },
    audit: {
      list: (tenantId) => get(`${tenant(tenantId)}/audit-log`),
    },
    indicators: {
      get: (tenantId, range) => get(`${tenant(tenantId)}/indicators`, { ...range }),
    },
    deputacions: {
      get: (id) => get(deputacion(id)),
      listCouncils: (id) => get(`${deputacion(id)}/councils`),
      indicators: (id, range) => get(`${deputacion(id)}/indicators`, { ...range }),
      createCouncil: (id, input) => post(`${deputacion(id)}/councils`, input),
    },
  };
}
