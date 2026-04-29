'use client';
import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600">500</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mt-4">Something Went Wrong</h2>
        <p className="text-gray-600 mt-2">We encountered an unexpected error.</p>
        <button
          onClick={reset}
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
