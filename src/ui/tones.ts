// SPDX-License-Identifier: EUPL-1.2
import type { IconName } from './Icon';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const TONE_ICONS: Record<Tone, IconName> = {
  success: 'success',
  warning: 'warning',
  danger: 'error',
  info: 'info',
  neutral: 'neutral',
};
