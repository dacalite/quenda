// SPDX-License-Identifier: EUPL-1.2
import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';
import '../i18n';

// jsdom has no layout, so it lacks this method.
Element.prototype.scrollIntoView = () => undefined;

// The first render of the whole app can take over a second on a busy machine or CI runner.
configure({ asyncUtilTimeout: 5000 });

afterEach(cleanup);
