import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:bg-blue-800',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
        outline:
          'border border-gray-300 bg-transparent hover:bg-blue-600 hover:text-white active:bg-blue-700',
        secondary:
          'bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200',
        ghost: 'hover:bg-blue-100 hover:text-blue-700 active:bg-blue-200',
        link: 'text-blue-600 underline-offset-4 hover:underline active:text-blue-800',
      },
      size: {
        default: 'h-11 sm:h-10 px-4 sm:px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-[40px]',
        sm: 'h-10 sm:h-9 rounded-lg px-3 sm:px-3 min-h-[44px] sm:min-h-[36px]',
        lg: 'h-12 sm:h-11 rounded-lg px-6 sm:px-8 py-3 sm:py-2.5 min-h-[48px] sm:min-h-[44px]',
        icon: 'h-11 w-11 sm:h-10 sm:w-10 min-h-[44px] sm:min-h-[40px]',
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
  ({ className, variant, size, asChild, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
