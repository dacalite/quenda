// SPDX-License-Identifier: EUPL-1.2
import { createContext, use } from 'react';
import { APP_NAME } from '../config/app';
import { createLocalDatabase } from '../data/adapters/local/database';
import { createLocalRepositories } from '../data/adapters/local/repositories';
import type { Repositories } from '../data/ports/repositories';
import { generateSeed } from '../data/seed/generate';
import { daysBetween, zonedNow } from '../domain/time';
import { sessionUserId } from './state';

const DEMO_TIME_ZONE = 'Europe/Madrid';
const STALE_AFTER_DAYS = 7;

const today = () => zonedNow(new Date(), DEMO_TIME_ZONE).date;

const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();

const db = createLocalDatabase(
  storage,
  `${APP_NAME}.db`,
  () => generateSeed(today()),
  (stored) => daysBetween(stored.generatedFor, today()) > STALE_AFTER_DAYS,
);

export const localRepositories = createLocalRepositories({
  db,
  session: () => {
    const userId = sessionUserId();
    return userId ? { userId } : null;
  },
});

export const resetDemoData = () => {
  db.reset();
};

export const RepositoriesContext = createContext<Repositories>(localRepositories);

export const useRepositories = () => use(RepositoriesContext);
