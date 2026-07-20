import React, { useState, useCallback } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleReload = useCallback(() => {
    setHasError(false);
    setError(null);
    window.location.reload();
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            The app encountered an unexpected error. Please try reloading.
          </p>
          <button
            onClick={handleReload}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-500 transition-colors"
          >
            Reload App
          </button>
          {error && (
            <details className="mt-6 text-left">
              <summary className="text-xs text-slate-400 cursor-pointer mb-2">
                Technical details
              </summary>
              <pre className="text-[10px] bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-auto max-h-40 text-red-600 dark:text-red-400">
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
