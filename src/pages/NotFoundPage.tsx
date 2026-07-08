import React from 'react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary px-6">
      <h1
        className="text-8xl font-serif font-bold text-text-primary"
        style={{ borderRadius: 0 }}
      >
        404
      </h1>
      <h2 className="mt-4 text-2xl font-serif text-text-primary">Page not found</h2>
      <p className="mt-2 text-text-muted text-center max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a
        href="/"
        className="mt-8 px-6 py-2 text-white font-medium hover:opacity-90 transition-opacity"
        style={{ backgroundColor: '#C108AB', borderRadius: 0 }}
      >
        Return to Dashboard
      </a>
    </div>
  );
}
