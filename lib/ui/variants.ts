import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Mobile-first responsive button variants
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 min-h-[44px] px-4 py-2', // 44px minimum touch target
        sm: 'h-9 min-h-[44px] px-3', // Maintain 44px height on mobile
        lg: 'h-14 min-h-[48px] px-8', // Larger for better mobile UX
        icon: 'h-11 w-11 min-h-[44px] min-w-[44px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// Mobile-first responsive card variants
export const cardVariants = cva(
  'rounded-xl border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      variant: {
        default: 'border-border',
        elevated: 'border-0 shadow-lg',
        outlined: 'border-2',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4 sm:p-6',
        default: 'p-6 sm:p-8',
        lg: 'p-8 sm:p-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  }
);

// Mobile-first responsive input variants
export const inputVariants = cva(
  'flex h-11 min-h-[44px] w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation',
  {
    variants: {
      variant: {
        default: '',
        error: 'border-destructive focus-visible:ring-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Mobile container utilities
export const containerVariants = {
  fluid: 'w-full px-4 sm:px-6 lg:px-8',
  fixed: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  narrow: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',
  wide: 'max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8',
};

// Grid utilities for responsive layouts
export const gridVariants = {
  auto: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
  two: 'grid grid-cols-1 gap-4 sm:grid-cols-2',
  three: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
  four: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
  responsive: 'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
};

// Text size utilities optimized for mobile
export const textVariants = {
  xs: 'text-xs sm:text-sm',
  sm: 'text-sm sm:text-base',
  base: 'text-base sm:text-lg',
  lg: 'text-lg sm:text-xl lg:text-2xl',
  xl: 'text-xl sm:text-2xl lg:text-3xl',
  '2xl': 'text-2xl sm:text-3xl lg:text-4xl',
  '3xl': 'text-3xl sm:text-4xl lg:text-5xl',
  '4xl': 'text-4xl sm:text-5xl lg:text-6xl',
};

// Spacing utilities
export const spacingVariants = {
  section: 'py-12 sm:py-16 lg:py-20',
  sectionSm: 'py-8 sm:py-12 lg:py-16',
  sectionLg: 'py-16 sm:py-20 lg:py-24',
  content: 'px-4 sm:px-6 lg:px-8',
};

// Animation utilities optimized for mobile
export const animationVariants = {
  fadeIn: 'animate-in fade-in duration-200',
  slideUp: 'animate-in slide-in-from-bottom duration-300',
  slideDown: 'animate-in slide-in-from-top duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-200',
};

// Helper function to combine utilities
export function responsiveClasses(...classes: (string | undefined | null | false)[]) {
  return cn(...classes);
}
