// SPDX-License-Identifier: EUPL-1.2
import type { RuleViolation } from '../../domain/rules/booking';
import type { CancelViolation, ModifyViolation } from '../../domain/rules/cancellation';
import type { FieldProblem } from '../../domain/validation';

/** 404: the resource does not exist in this tenant. */
export class NotFoundError extends Error {
  override readonly name = 'NotFoundError';
  constructor(
    readonly resource: string,
    readonly id: string,
  ) {
    super(`${resource} ${id} not found`);
  }
}

/** 403: the signed-in person may not do this, e.g. a resident reading someone else's booking. */
export class ForbiddenError extends Error {
  override readonly name = 'ForbiddenError';
}

/** 409: the request clashes with the current state, e.g. the slot was just taken. */
export class ConflictError extends Error {
  override readonly name = 'ConflictError';
}

/** 422: the request breaks one or more booking rules. */
export class RuleViolationError extends Error {
  override readonly name = 'RuleViolationError';
  constructor(readonly violations: (RuleViolation | CancelViolation | ModifyViolation)[]) {
    super(violations.map((v) => v.code).join(', '));
  }
}

/** 400: the submitted data is incomplete or out of range, field by field. */
export class ValidationError extends Error {
  override readonly name = 'ValidationError';
  constructor(readonly problems: FieldProblem[]) {
    super(problems.map((p) => `${p.field}: ${p.code}`).join(', '));
  }
}
