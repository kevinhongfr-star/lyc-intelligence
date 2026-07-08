import React from 'react';

export default function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary px-6">
      <h1
        className="text-8xl font-serif font-bold text-text-primary"
        style={{ borderRadius: 0 }}
      >
        500
      </h1>
      <h2 className="mt-4 text-2xl font-serif text-text-primary">Something went wrong</h2>
      <p className="mt-2 text-text-muted text-center max-w-md">
        We're experiencing an unexpected error. Our team has been notified.
      </p>
      <div className="mt-8 flex flex-col items-center gap-4">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 text-white font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#C108AB', borderRadius: 0 }}
        >
          Try Again
        </button>
        <a
          href="/"
          className="text-sm hover:underline"
          style={{ color: '#C108AB' }}
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}
