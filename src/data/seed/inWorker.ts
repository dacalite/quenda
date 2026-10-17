// SPDX-License-Identifier: EUPL-1.2
import type { Database } from '../adapters/local/database';
import type { IsoDate } from '../../domain/types';
import { generateSeed } from './generate';

/**
 * Builds the demo data off the main thread, so a first visit on a slow phone can still paint and
 * respond while it runs. Without workers it is built in place.
 */
export async function generateSeedInWorker(today: IsoDate): Promise<Database> {
  if (typeof Worker === 'undefined') return generateSeed(today);
  const worker = new Worker(new URL('./seed.worker.ts', import.meta.url), { type: 'module' });
  try {
    const json = await new Promise<string>((resolve, reject) => {
      worker.onmessage = (event: MessageEvent<string>) => {
        resolve(event.data);
      };
      worker.onerror = reject;
      worker.postMessage(today);
    });
    return JSON.parse(json) as Database;
  } catch {
    return generateSeed(today);
  } finally {
    worker.terminate();
  }
}
