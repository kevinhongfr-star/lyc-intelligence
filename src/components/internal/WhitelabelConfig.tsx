import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';

export function WhitelabelConfig() {
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#C108AB');
  const [companyName, setCompanyName] = useState('LYC Intelligence');
  const [customDomain, setCustomDomain] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <Palette className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">WHITELABEL CONFIGURATION</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-text-muted mb-1">Logo URL</label>
          <input
            type="text"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
            className="w-full border border-bg-tertiary bg-bg-primary px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1">Primary Color</label>
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-full h-10 border border-bg-tertiary bg-bg-primary cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1">Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full border border-bg-tertiary bg-bg-primary px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1">Custom Domain</label>
          <input
            type="text"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="talent.yourcompany.com"
            className="w-full border border-bg-tertiary bg-bg-primary px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1">Support Email</label>
          <input
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            placeholder="support@yourcompany.com"
            className="w-full border border-bg-tertiary bg-bg-primary px-3 py-2 text-sm text-text-primary"
          />
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-text-muted mb-2">Live Preview</p>
        <div className="border border-bg-tertiary p-4 bg-bg-secondary">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6" style={{ backgroundColor: primaryColor }} />
            <span className="font-serif text-lg font-bold text-text-primary">
              {companyName || 'LYC Intelligence'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          className="bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-hover"
        >
          Save Changes
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-teal">
            <Check className="w-4 h-4" />
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
