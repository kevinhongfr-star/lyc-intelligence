import React from 'react';

interface ComplianceBadgeProps {
  framework: string;
  status: 'compliant' | 'certified' | 'in_progress' | 'not_applicable' | 'non_compliant';
  size?: 'sm' | 'md' | 'lg';
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  compliant: { bg: '#dcfce7', text: '#166534', label: 'Compliant' },
  certified: { bg: '#dbeafe', text: '#1e40af', label: 'Certified' },
  in_progress: { bg: '#fef3c7', text: '#92400e', label: 'In Progress' },
  not_applicable: { bg: '#f3f4f6', text: '#6b7280', label: 'N/A' },
  non_compliant: { bg: '#fee2e2', text: '#991b1b', label: 'Non-Compliant' },
};

export function ComplianceBadge({ framework, status, size = 'md' }: ComplianceBadgeProps) {
  const style = statusStyles[status] || statusStyles.not_applicable;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-base px-4 py-2' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center font-medium ${sizeClasses}`}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.text}33`,
      }}
      data-testid={`compliance-badge-${framework}`}
    >
      <span className="mr-1">{framework}</span>
      <span className="opacity-75">·</span>
      <span className="ml-1">{style.label}</span>
    </span>
  );
}