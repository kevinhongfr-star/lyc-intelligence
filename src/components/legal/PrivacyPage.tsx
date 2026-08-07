import React from 'react';

interface PrivacyPageProps {
  onAccept?: (version: string) => void;
  acceptedVersion?: string | null;
}

export function PrivacyPage({ onAccept, acceptedVersion }: PrivacyPageProps) {
  const currentVersion = '2.1';
  const isAccepted = acceptedVersion === currentVersion;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-4">Version {currentVersion} | Updated July 15, 2026</p>

      <div className="prose max-w-none bg-white p-6 border border-gray-300 text-[15px] leading-relaxed">
        <h2>1. Information We Collect</h2>
        <p>We collect information you provide directly, such as when you create an account or contact us. We also automatically collect certain information when you visit our platform.</p>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to: provide, maintain, and improve our services; process transactions; send you related information; personalize your experience.</p>

        <h2>3. Data Sharing</h2>
        <p>We do not sell, trade, or otherwise transfer your personally identifiable information to third parties.</p>

        <h2>4. Data Security</h2>
        <p>We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process.</p>

        <h2>5. Your Rights</h2>
        <p>You have the right to access, update, or delete your personal information at any time.</p>

        <h2>6. Cookies</h2>
        <p>We use cookies and similar tracking technologies to track activity on our platform.</p>
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-300 text-sm">
        <strong>Your rights:</strong> Access, export, or delete your data. Contact privacy@platform.com for requests.
      </div>

      {onAccept && !isAccepted && (
        <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 border border-gray-300">
          <span className="text-sm">Please accept the current privacy policy to continue.</span>
          <button
            onClick={() => onAccept(currentVersion)}
            className="px-4 py-2 text-white text-sm font-medium"
            style={{ backgroundColor: '#C108AB' }}
          >
            Accept Privacy Policy
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