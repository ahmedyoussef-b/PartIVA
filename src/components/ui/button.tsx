'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-tech-primary text-white shadow-tech-sm hover:bg-tech-primary-deep transition-colors',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-gray-300 bg-white text-gray-700 shadow-tech-sm hover:bg-gray-50 hover:text-gray-900',
        secondary: 'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200',
        ghost: 'hover:bg-gray-100 hover:text-gray-900',
        success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
        warning: 'bg-amber-600 text-white shadow-sm hover:bg-amber-700',
        tech: 'bg-tech-primary text-white rounded-full font-semibold shadow hover:bg-tech-accent hover:shadow-tech-glow transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0',
        'tech-outline':
          'border border-white/40 bg-transparent text-white rounded-full font-medium hover:border-tech-primary hover:bg-white/10 transition-all duration-300',
      },
      size: {
        default: 'h-9 rounded-lg px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-lg px-8 text-base',
        icon: 'h-9 w-9 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  ref,
  ...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
}

export { Button, buttonVariants };
