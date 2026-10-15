// SPDX-License-Identifier: EUPL-1.2
import { Link as AriaLink, type LinkProps as AriaLinkProps } from 'react-aria-components';
import { buttonClass, type ButtonVariant } from './buttonClass';

export interface LinkProps extends Omit<AriaLinkProps, 'className'> {
  /** Renders the link with button styles, for calls to action that navigate. */
  variant?: ButtonVariant;
  className?: string;
}

export function Link({ variant, className, ...props }: LinkProps) {
  return <AriaLink {...props} className={variant ? buttonClass(variant, className) : className} />;
}
