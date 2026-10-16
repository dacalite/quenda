// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import type { FieldProblem } from '../../domain/validation';
import type { FormError } from '../../ui/ErrorSummary';

/** Input ids follow the field path, so a problem from the server finds its field on the page. */
export const fieldId = (form: string, path: string) => `${form}-${path.replaceAll('.', '-')}`;

/** Turns validation problems into error-summary entries, labelled as each field is on screen. */
export function useProblemMessages(form: string, label: (path: string) => string) {
  const { t } = useTranslation('admin');
  return (problems: FieldProblem[]): FormError[] =>
    problems.map((problem) => ({
      fieldId: fieldId(form, problem.field),
      message: t(`problem.${problem.code}`, { field: label(problem.field) }),
    }));
}
