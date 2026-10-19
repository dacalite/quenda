// SPDX-License-Identifier: EUPL-1.2
import { Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';
import { Button } from './Button';
import type { ButtonVariant } from './buttonClass';
import { Icon, type IconName } from './Icon';
import styles from './overlays.module.css';

export interface MenuAction {
  id: string;
  label: string;
  icon?: IconName;
  /** Opens in a new tab: the item says so to screen readers and shows an icon. */
  href?: string;
  onAction?: () => void;
}

export function MenuButton({
  label,
  icon,
  variant = 'secondary',
  items,
  newTabHint,
}: {
  label: string;
  icon?: IconName;
  variant?: ButtonVariant;
  items: MenuAction[];
  /** Read after the label of every link item, e.g. «opens in a new tab». */
  newTabHint: string;
}) {
  return (
    <MenuTrigger>
      <Button variant={variant}>
        {icon && <Icon name={icon} />}
        {label}
        <Icon name="chevronDown" />
      </Button>
      <Popover className={styles.popover} placement="bottom start">
        <Menu
          className={styles.listbox}
          onAction={(key) => {
            items.find((item) => item.id === key)?.onAction?.();
          }}
        >
          {items.map((item) => (
            <MenuItem
              key={item.id}
              id={item.id}
              textValue={item.label}
              className={styles.option}
              {...(item.href
                ? {
                    href: item.href,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    'aria-label': `${item.label}, ${newTabHint}`,
                  }
                : {})}
            >
              {item.icon && <Icon name={item.icon} />}
              <span>{item.label}</span>
              {item.href && <Icon name="external" />}
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}
