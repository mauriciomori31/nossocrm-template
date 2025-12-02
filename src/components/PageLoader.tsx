import React from 'react';

export const PageLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-primary-200 dark:border-dark-border"></div>
          <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-primary-500 animate-spin"></div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
      </div>
    </div>
  );
};

export default PageLoader;
