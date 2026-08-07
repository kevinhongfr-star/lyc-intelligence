import React from 'react';

export function DPA() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Data Processing Agreement</h1>
      <p className="text-sm text-gray-500 mb-4">Version 1.5 | Updated June 1, 2026</p>

      <div className="prose max-w-none bg-white p-6 border border-gray-300 text-[15px] leading-relaxed">
        <p>This Data Processing Agreement ("DPA") is entered into between the Customer and the Platform.</p>

        <h2>1. Processor Obligations</h2>
        <p>The Processor will process personal data only for the purposes specified in this Agreement and will implement appropriate technical and organizational security measures.</p>

        <h2>2. Data Subject Rights</h2>
        <p>The Processor will assist the Controller in responding to data subject access requests, rectification requests, erasure requests, and data portability requests.</p>

        <h2>3. Data Transfer</h2>
        <p>Any transfer of personal data from the European Economic Area to countries outside the EEA will be subject to appropriate safeguards.</p>

        <h2>4. Subprocessing</h2>
        <p>The Processor may engage sub-processors with the prior written consent of the Controller.</p>

        <h2>5. Termination</h2>
        <p>Upon termination, the Processor will return or delete all personal data within 30 days.</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="p-4 bg-gray-50 border border-gray-300">
          <div className="font-semibold mb-1">Compliance</div>
          <ul className="list-disc list-inside text-gray-600">
            <li>GDPR: Compliant</li>
            <li>CCPA: Compliant</li>
            <li>SOC 2: In progress</li>
            <li>ISO 27001: Certified</li>
          </ul>
        </div>
        <div className="p-4 bg-gray-50 border border-gray-300">
          <div className="font-semibold mb-1">Data Residency</div>
          <ul className="list-disc list-inside text-gray-600">
            <li>US East (Virginia)</li>
            <li>EU West (Ireland)</li>
            <li>EU Central (Frankfurt)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}