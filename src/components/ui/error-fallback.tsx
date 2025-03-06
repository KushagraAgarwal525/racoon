import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorFallback({ message = 'Failed to load data', onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-red-50 border border-red-100 rounded-lg text-red-800 space-y-2">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        <span className="font-medium">{message}</span>
      </div>
      
      {onRetry && (
        <button 
          onClick={onRetry}
          className="flex items-center gap-1 px-3 py-1 mt-2 text-sm bg-white border border-red-200 rounded-md hover:bg-red-50"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
