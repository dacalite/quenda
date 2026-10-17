// SPDX-License-Identifier: EUPL-1.2
import type { IsoDate } from '../../domain/types';
import { generateSeed } from './generate';

const scope = self as unknown as {
  onmessage: (event: MessageEvent<IsoDate>) => void;
  postMessage: (message: string) => void;
};

// Sent as JSON: one string crosses to the page faster than a cloned object graph.
scope.onmessage = (event) => {
  scope.postMessage(JSON.stringify(generateSeed(event.data)));
};
