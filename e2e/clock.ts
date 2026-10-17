// SPDX-License-Identifier: EUPL-1.2
import type { Page } from '@playwright/test';

/**
 * Monday 19 October 2026, 10:00 in Galicia: early enough that every facility still has free
 * slots today, whenever the suite runs. Pair it with `timezoneId: 'Europe/Madrid'`.
 * Only Date is frozen; Playwright's clock would also replace Intl, which the Galician fallback extends.
 */
export const MONDAY_MORNING = Date.parse('2026-10-19T10:00:00+02:00');

export async function freezeDate(page: Page, instant = MONDAY_MORNING) {
  await page.addInitScript((fixed) => {
    const RealDate = Date;
    class FrozenDate extends RealDate {
      constructor(value?: string | number | Date) {
        super(value ?? fixed);
      }
      static override now() {
        return fixed;
      }
    }
    window.Date = FrozenDate as DateConstructor;
  }, instant);
}
