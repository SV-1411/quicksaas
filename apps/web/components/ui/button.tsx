import { cva, type VariantProps } from 'class-variance-authority';
import { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const variants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:opacity-90',
        outline: 'border border-border bg-card hover:bg-accent',
        ghost: 'hover:bg-accent',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-11 px-6',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export function Button({ className, variant, size, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof variants>) {
  return <button className={cn(variants({ variant, size }), className)} {...props} />;
}
