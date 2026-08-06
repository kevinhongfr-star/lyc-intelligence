import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusDot, StatusPill } from '../status/StatusDot';
import { ProgressRing, ScoreGauge } from '../status/ProgressRing';
import { StepIndicator } from '../status/StepIndicator';
import { StatusBadge } from '../status/StatusBadge';
import { EmptyState } from '../EmptyState';

describe('StatusDot', () => {
  it('renders with status', () => {
    render(<StatusDot status="active" label="Online" />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders pulse animation when enabled', () => {
    const { container } = render(<StatusDot status="error" showPulse />);
    expect(container.querySelector('.animate-ping')).toBeInTheDocument();
  });

  it('supports different sizes', () => {
    const { container } = render(<StatusDot status="success" size="lg" />);
    const dot = container.querySelector('.w-3');
    expect(dot).toBeInTheDocument();
  });
});

describe('StatusPill', () => {
  it('renders with label', () => {
    render(<StatusPill status="pending" label="In Review" />);
    expect(screen.getByText('In Review')).toBeInTheDocument();
  });
});

describe('ProgressRing', () => {
  it('renders progress circle', () => {
    const { container } = render(<ProgressRing value={65} size={64} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('shows label when enabled', () => {
    render(<ProgressRing value={75} showLabel />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('clamps value to 0-100', () => {
    render(<ProgressRing value={150} showLabel />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('supports children content', () => {
    render(
      <ProgressRing value={50}>
        <span className="text-sm font-bold">50</span>
      </ProgressRing>,
    );
    expect(screen.getByText('50')).toBeInTheDocument();
  });
});

describe('ScoreGauge (status)', () => {
  it('renders score with color', () => {
    const { container } = render(<ScoreGauge score={85} label="Match" />);
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('Match')).toBeInTheDocument();
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

describe('StepIndicator', () => {
  const steps = [
    { label: 'Submit', status: 'completed' as const },
    { label: 'Review', status: 'active' as const },
    { label: 'Approval', status: 'upcoming' as const },
  ];

  it('renders all steps', () => {
    render(<StepIndicator steps={steps} />);
    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Approval')).toBeInTheDocument();
  });

  it('supports vertical layout', () => {
    render(<StepIndicator steps={steps} orientation="vertical" />);
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });
});

describe('StatusBadge', () => {
  it('renders with color and filled variant', () => {
    render(<StatusBadge color="success" variant="filled">Approved</StatusBadge>);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('supports outlined variant', () => {
    render(<StatusBadge color="warning" variant="outlined">Pending</StatusBadge>);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('supports soft variant', () => {
    render(<StatusBadge color="error" variant="soft">Failed</StatusBadge>);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders default variant', () => {
    render(<EmptyState />);
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });

  it('renders no-results variant', () => {
    render(<EmptyState variant="no-results" />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('renders no-data variant', () => {
    render(<EmptyState variant="no-data" />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders error variant', () => {
    render(<EmptyState variant="error" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders welcome variant', () => {
    render(<EmptyState variant="welcome" />);
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });

  it('renders action button', () => {
    render(
      <EmptyState
        variant="default"
        actionLabel="Create Item"
        onAction={() => {}}
      />,
    );
    expect(screen.getByText('Create Item')).toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    render(
      <EmptyState
        title="Custom Title"
        description="Custom description"
      />,
    );
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom description')).toBeInTheDocument();
  });
});
