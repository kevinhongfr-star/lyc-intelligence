import React from 'react';

interface TermsPageProps {
  onAccept?: (version: string) => void;
  acceptedVersion?: string | null;
}

export function TermsPage({ onAccept, acceptedVersion }: TermsPageProps) {
  const currentVersion = '2.3';
  const isAccepted = acceptedVersion === currentVersion;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-4">Version {currentVersion} | Updated August 1, 2026</p>

      <div className="prose max-w-none bg-white p-6 border border-gray-300 text-[15px] leading-relaxed">
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing and using this platform, you agree to be bound by these Terms of Service.</p>

        <h2>2. Use License</h2>
        <p>Permission is granted to temporarily download one copy of the materials on any single computer for personal, non-commercial transitory viewing only.</p>

        <h2>3. Restrictions</h2>
        <p>You may not modify or copy the materials; use the materials for any commercial purpose or for any public display; attempt to decompile or reverse engineer any software contained on the platform.</p>

        <h2>4. Disclaimer</h2>
        <p>The materials on this platform are provided on an 'as is' basis. The platform makes no warranties, expressed or implied.</p>

        <h2>5. Limitations</h2>
        <p>In no event shall the platform or its suppliers be liable for any damages arising out of the use or inability to use the materials.</p>

        <h2>6. Revisions and Errata</h2>
        <p>The materials appearing on this platform could include technical, typographical, or photographic errors.</p>
      </div>

      {onAccept && !isAccepted && (
        <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 border border-gray-300">
          <span className="text-sm">Please accept the current terms to continue using the platform.</span>
          <button
            onClick={() => onAccept(currentVersion)}
            className="px-4 py-2 text-white text-sm font-medium"
            style={{ backgroundColor: '#C108AB' }}
          >
            Accept Terms
          </button>
        </div>
      )}

      {isAccepted && (
        <div className="mt-4 p-3 bg-green-50 border border-green-300 text-green-800 text-sm">
          ✓ You have accepted version {currentVersion}
        </div>
      )}
    </div>
  );
}