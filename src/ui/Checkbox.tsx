// SPDX-License-Identifier: EUPL-1.2
import type { ReactNode } from 'react';
import {
  CheckboxButton,
  CheckboxField,
  Text,
  type CheckboxFieldProps,
} from 'react-aria-components';
import styles from './choices.module.css';
import { Icon } from './Icon';

export interface CheckboxProps extends Omit<CheckboxFieldProps, 'className' | 'children'> {
  children: ReactNode;
  description?: string;
}

export function Checkbox({ children, description, ...props }: CheckboxProps) {
  return (
    <CheckboxField {...props}>
      <CheckboxButton className={styles.choice}>
        {({ isSelected }) => (
          <>
            <span className={styles.box} aria-hidden="true">
              {isSelected && <Icon name="check" size="1rem" />}
            </span>
            <span>{children}</span>
          </>
        )}
      </CheckboxButton>
      {description && (
        <Text slot="description" className={styles.choiceDescription}>
          {description}
        </Text>
      )}
    </CheckboxField>
  );
}
