'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';

interface ResponsiveTableProps extends React.HTMLAttributes<HTMLTableElement> {
  mobileCard?: boolean;
  headers: string[];
  data: Record<string, React.ReactNode>[];
  keyExtractor: (row: Record<string, React.ReactNode>, index: number) => string;
}

export function ResponsiveTable({ 
  mobileCard = true, 
  headers, 
  data, 
  keyExtractor,
  className,
  ...props 
}: ResponsiveTableProps) {
  const isMobile = useIsMobile();

  if (isMobile && mobileCard) {
    // Mobile card layout
    return (
      <div className="space-y-4">
        {data.map((row, index) => {
          const key = keyExtractor(row, index);
          return (
            <div key={key} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              {headers.map((header, headerIndex) => {
                const cellKey = Object.keys(row)[headerIndex];
                const value = row[cellKey];
                
                if (!value) return null;
                
                return (
                  <div key={headerIndex} className="flex justify-between items-start gap-4">
                    <span className="text-sm font-medium text-gray-600 min-w-0 flex-shrink-0">
                      {header}
                    </span>
                    <span className="text-sm text-gray-900 text-right min-w-0 flex-1">
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop table layout
  return (
    <div className="relative w-full overflow-auto -mx-3 sm:mx-0">
      <div className="inline-block min-w-full align-middle sm:rounded-lg border border-gray-200">
        <table className={cn('w-full caption-bottom text-sm', className)} {...props}>
          <thead className="border-b bg-gray-50/50">
            <tr>
              {headers.map((header, index) => (
                <th 
                  key={index}
                  className="h-12 px-3 sm:px-4 text-left align-middle font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {data.map((row, index) => {
              const key = keyExtractor(row, index);
              return (
                <tr 
                  key={key}
                  className="border-b transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-gray-50"
                >
                  {Object.values(row).map((value, cellIndex) => (
                    <td 
                      key={cellIndex}
                      className="p-3 sm:p-4 align-middle [&:has([role=checkbox])]:pr-0 text-xs sm:text-sm break-words"
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Export original table components for backward compatibility
export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto -mx-3 sm:mx-0">
      <div className="inline-block min-w-full align-middle sm:rounded-lg border border-gray-200">
        <table
          ref={ref}
          className={cn('w-full caption-bottom text-sm', className)}
          {...props}
        />
      </div>
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('border-b bg-gray-50/50', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
));
TableBody.displayName = 'TableBody';

export const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('border-t bg-gray-50/50 font-medium', className)}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-gray-50',
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-3 sm:px-4 text-left align-middle font-medium text-gray-700 text-xs sm:text-sm',
      '[&:has([role=checkbox])]:pr-0',
      'whitespace-nowrap',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'p-3 sm:p-4 align-middle [&:has([role=checkbox])]:pr-0 text-xs sm:text-sm',
      'break-words',
      className
    )}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn('mt-4 text-sm text-gray-600', className)} {...props} />
));
TableCaption.displayName = 'TableCaption';
