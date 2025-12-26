'use client';
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

// ============================================
// BUTTON COMPONENT - Enhanced with gradients
// ============================================
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Enhanced default with gradient matching logo
        default:
          'bg-gradient-to-br from-[hsl(200,95%,58%)] to-[hsl(210,90%,52%)] text-white shadow-[0_4px_12px_hsla(200,95%,58%,0.25)] hover:shadow-[0_6px_20px_hsla(200,95%,58%,0.4)] hover:-translate-y-0.5 active:translate-y-0',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/50',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        // New gradient outline variant
        gradientOutline:
          'border-2 border-transparent bg-origin-border bg-clip-padding hover:shadow-[0_0_16px_hsla(200,95%,58%,0.3)] relative before:absolute before:inset-0 before:-z-10 before:rounded-md before:bg-gradient-to-br before:from-[hsl(200,95%,58%)] before:to-[hsl(210,90%,52%)] before:p-[2px] before:content-[""]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
