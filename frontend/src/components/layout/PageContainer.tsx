import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => {
  return (
    <main className={`flex-1 overflow-y-auto px-8 py-6 max-w-7xl w-full mx-auto ${className}`}>
      {children}
    </main>
  );
};
