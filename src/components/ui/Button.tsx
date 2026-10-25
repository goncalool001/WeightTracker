import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:opacity-90',
  secondary: 'border border-control bg-raised text-text hover:bg-active',
  ghost: 'bg-transparent text-text hover:bg-active',
  danger: 'border border-control bg-raised text-negative hover:bg-pill-neg',
};

// Touch targets stay 44px on phones and tablets; desktop tightens to 36px.
const sizes: Record<Size, string> = {
  sm: 'h-11 px-4 text-sm lg:h-9',
  md: 'h-11 px-5 text-[15px]',
};

/** Pill button. One primary (near-black) per view; the rest outline or text. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium',
        'transition-[background-color,opacity,transform] duration-150 active:scale-[0.98]',
        'disabled:pointer-events-none disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
