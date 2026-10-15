// SPDX-License-Identifier: EUPL-1.2
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import { buttonClass, type ButtonVariant } from './buttonClass';

export interface ButtonProps extends Omit<AriaButtonProps, 'className'> {
  variant?: ButtonVariant;
  className?: string;
}

export function Button({ variant = 'secondary', className, ...props }: ButtonProps) {
  return <AriaButton {...props} className={buttonClass(variant, className)} />;
}
