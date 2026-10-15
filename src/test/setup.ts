// SPDX-License-Identifier: EUPL-1.2
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '../i18n';

// jsdom has no layout, so it lacks this method.
Element.prototype.scrollIntoView = () => undefined;

afterEach(cleanup);
