import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
}

const Empty = ({
  icon,
  title = 'No results found',
  description = 'It looks like there is no data to display here.',
  className,
  children,
  ...props
}: EmptyProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
      {...props}
    >
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      {title && (
        <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      )}
      {description && (
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      {children}
    </div>
  );
};

export { Empty };