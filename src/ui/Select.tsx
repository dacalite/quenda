// SPDX-License-Identifier: EUPL-1.2
import {
  Button as AriaButton,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue,
} from 'react-aria-components';
import { useTranslation } from 'react-i18next';
import { FieldHelp, FieldLabel } from './FieldParts';
import fieldStyles from './fields.module.css';
import { Icon } from './Icon';
import styles from './overlays.module.css';

export interface SelectOption {
  id: string;
  label: string;
  /** Language of the label when it differs from the page, e.g. language names. */
  lang?: string;
}

export interface SelectProps {
  label: string;
  options: readonly SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  description?: string;
  errorMessage?: string | undefined;
  placeholder?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  name?: string;
  /** Goes on the button that opens the list, so an error summary can move focus to it. */
  id?: string;
  className?: string;
}

export function Select({
  label,
  options,
  value,
  onChange,
  description,
  errorMessage,
  placeholder,
  isRequired = false,
  id,
  className,
  ...props
}: SelectProps) {
  const { t } = useTranslation('ui');
  return (
    <AriaSelect
      {...props}
      value={value}
      onChange={(key) => {
        if (key !== null) onChange(String(key));
      }}
      placeholder={placeholder ?? t('select.placeholder')}
      isRequired={isRequired}
      isInvalid={Boolean(errorMessage)}
      validationBehavior="aria"
      className={[fieldStyles.field, className].filter(Boolean).join(' ')}
    >
      <FieldLabel isRequired={isRequired}>{label}</FieldLabel>
      <AriaButton id={id} className={styles.trigger}>
        <SelectValue>
          {({ isPlaceholder, selectedText, defaultChildren }) =>
            isPlaceholder ? defaultChildren : selectedText
          }
        </SelectValue>
        <Icon name="chevronDown" />
      </AriaButton>
      <FieldHelp description={description} errorMessage={errorMessage} />
      <Popover className={styles.popover}>
        <ListBox className={styles.listbox} items={options}>
          {(option) => (
            <ListBoxItem
              id={option.id}
              textValue={option.label}
              lang={option.lang}
              className={styles.option}
            >
              {({ isSelected }) => (
                <>
                  <span className={styles.check}>{isSelected && <Icon name="check" />}</span>
                  {option.label}
                </>
              )}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}
