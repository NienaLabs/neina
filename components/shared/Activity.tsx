import { Suspense, ReactNode } from 'react';

interface ActivityProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const Activity = ({ children, fallback }: ActivityProps) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};
