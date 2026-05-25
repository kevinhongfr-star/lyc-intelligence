import React from 'react';
import { Briefcase, FileText, Lightbulb } from 'lucide-react';

const DS = {
  headingFont: 'Georgia, serif',
  accent: '#C108AB',
  bg: '#0A0A0A',
  card: '#111111',
  muted: '#888888',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  border: '#222222',
  radius: '12px'
};

interface JDInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function JDInput({ value, onChange }: JDInputProps) {
  return (
    <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '24px' }}>
      <h3 style={{ 
        fontFamily: DS.headingFont, 
        fontSize: '16px', 
        fontWeight: 600, 
        color: DS.text, 
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Briefcase style={{ width: 18, height: 18, color: DS.accent }} />
        Job Description
      </h3>
      
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the full job description here — role, requirements, qualifications, company context...

Example:
• Role: Chief Financial Officer
• Location: Singapore
• Requirements: 15+ years experience, C-suite background, APAC market expertise
• Company: Series C fintech expanding to Southeast Asia"
        style={{
          width: '100%',
          minHeight: '200px',
          background: DS.bg,
          border: `1px solid ${DS.border}`,
          borderRadius: '8px',
          padding: '14px',
          color: DS.text,
          fontSize: '13px',
          lineHeight: 1.6,
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'Inter, sans-serif'
        }}
      />

      <div style={{ 
        marginTop: '12px',
        padding: '12px',
        background: `${DS.accent}10`,
        border: `1px solid ${DS.accent}30`,
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <Lightbulb style={{ width: 16, height: 16, color: DS.accent, flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '12px', color: DS.textSecondary }}>
            <strong style={{ color: DS.text }}>Pro tip:</strong> The more detailed the JD, the more accurate the TRIDENT matching. Include responsibilities, required skills, reporting structure, and any cross-border requirements.
          </div>
        </div>
      </div>

      {value.length > 0 && (
        <div style={{ 
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: DS.muted
        }}>
          <FileText style={{ width: 14, height: 14 }} />
          {value.length.toLocaleString()} characters
        </div>
      )}
    </div>
  );
}
