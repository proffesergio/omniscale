import { Slot } from '@radix-ui/react-slot';
import type { ButtonHTMLAttributes } from 'react';
export function Button({
  asChild,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: 'primary' | 'dark' | 'outline';
}) {
  const Component = asChild ? Slot : 'button';
  return <Component className={`button button-${variant} ${className}`} {...props} />;
}
