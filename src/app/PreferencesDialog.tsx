// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import type { TextSize } from '../domain/types';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { DialogTrigger, Modal } from '../ui/Dialog';
import { Icon } from '../ui/Icon';
import { RadioGroup } from '../ui/RadioGroup';
import { usePreferences } from './state';

const TEXT_SIZES: TextSize[] = ['normal', 'large', 'xlarge'];

export function PreferencesDialog() {
  const { t } = useTranslation();
  const { textSize, highContrast, reducedMotion, update } = usePreferences();

  return (
    <DialogTrigger>
      <Button variant="quiet">
        <Icon name="accessibility" />
        <span className="hide-narrow">{t('preferences.open')}</span>
      </Button>
      <Modal title={t('preferences.title')}>
        <p>{t('preferences.intro')}</p>
        <RadioGroup
          label={t('preferences.textSize.label')}
          value={textSize}
          onChange={(value) => {
            update({ textSize: value as TextSize });
          }}
          options={TEXT_SIZES.map((size) => ({
            id: size,
            label: t(`preferences.textSize.${size}`),
          }))}
        />
        <Checkbox
          isSelected={highContrast}
          onChange={(value) => {
            update({ highContrast: value });
          }}
        >
          {t('preferences.highContrast')}
        </Checkbox>
        <Checkbox
          isSelected={reducedMotion}
          onChange={(value) => {
            update({ reducedMotion: value });
          }}
        >
          {t('preferences.reducedMotion')}
        </Checkbox>
      </Modal>
    </DialogTrigger>
  );
}
