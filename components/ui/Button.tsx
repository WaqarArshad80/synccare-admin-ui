import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: boolean;
  block?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
};

/** Modernist button — maps to the .btn classes in globals.css. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', icon, block, className = '', type = 'button', ...props },
  ref,
) {
  const classes = [
    'btn',
    variantClass[variant],
    icon ? 'btn-icon' : '',
    block ? 'btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button ref={ref} type={type} className={classes} {...props} />;
});
