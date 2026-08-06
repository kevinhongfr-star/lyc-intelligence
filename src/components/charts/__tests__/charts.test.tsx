import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FunnelChart } from '../FunnelChart';
import { Heatmap } from '../Heatmap';
import { GanttChart } from '../GanttChart';
import { RadarChart } from '../RadarChart';
import { ScoreGaugeChart, RadialGauge } from '../ScoreGauge';
import { KPICard } from '../KPICard';
import { ComparisonMatrix } from '../ComparisonMatrix';

describe('FunnelChart', () => {
  const stages = [
    { label: 'Leads', value: 100 },
    { label: 'Qualified', value: 60 },
    { label: 'Proposal', value: 30 },
    { label: 'Closed', value: 15 },
  ];

  it('renders all stages', () => {
    render(<FunnelChart stages={stages} />);
    expect(screen.getByText('Leads')).toBeInTheDocument();
    expect(screen.getByText('Qualified')).toBeInTheDocument();
    expect(screen.getByText('Proposal')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('shows percentages when enabled', () => {
    render(<FunnelChart stages={stages} showPercentage />);
    const bars = screen.getAllByRole('listitem');
    expect(bars).toHaveLength(4);
    expect(bars[0].textContent).toContain('100');
    expect(bars[1].textContent).toContain('60');
  });

  it('hides percentages when disabled', () => {
    render(<FunnelChart stages={stages} showPercentage={false} />);
    const bars = screen.getAllByRole('listitem');
    expect(bars[0].textContent).not.toContain('%');
  });

  it('renders with custom colors', () => {
    const colored = stages.map((s) => ({ ...s, color: '#FF0000' }));
    render(<FunnelChart stages={colored} />);
    const bars = screen.getAllByRole('listitem');
    expect(bars).toHaveLength(4);
  });
});

describe('Heatmap', () => {
  const cells = Array.from({ length: 56 }, (_, i) => ({
    value: Math.floor(Math.random() * 5),
    label: `Day ${i + 1}`,
  }));

  it('renders cells in a grid', () => {
    render(<Heatmap cells={cells} columns={7} />);
    const grid = screen.getByRole('grid');
    expect(grid).toBeInTheDocument();
    const gridCells = screen.getAllByRole('gridcell');
    expect(gridCells).toHaveLength(56);
  });

  it('shows legend', () => {
    render(<Heatmap cells={cells} showLegend />);
    expect(screen.getByText('Less')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('hides legend when disabled', () => {
    render(<Heatmap cells={cells} showLegend={false} />);
    expect(screen.queryByText('Less')).not.toBeInTheDocument();
  });
});

describe('GanttChart', () => {
  const tasks = [
    { id: '1', label: 'Research', start: 0, duration: 5, progress: 100 },
    { id: '2', label: 'Design', start: 3, duration: 8, progress: 60 },
    { id: '3', label: 'Development', start: 8, duration: 12, progress: 25 },
  ];

  it('renders task labels', () => {
    render(<GanttChart tasks={tasks} totalDuration={20} />);
    expect(screen.getByText('Research')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText('Development')).toBeInTheDocument();
  });

  it('renders progress bars with ARIA', () => {
    render(<GanttChart tasks={tasks} totalDuration={20} showProgress />);
    const bars = screen.getAllByRole('progressbar');
    expect(bars).toHaveLength(3);
  });
});

describe('RadarChart', () => {
  const axes = [
    { label: 'Quality', value: 85 },
    { label: 'Speed', value: 70 },
    { label: 'Cost', value: 60 },
    { label: 'Innovation', value: 90 },
  ];

  it('renders SVG radar', () => {
    render(<RadarChart axes={axes} />);
    const svg = screen.getByRole('img');
    expect(svg).toBeInTheDocument();
  });

  it('renders axis labels', () => {
    render(<RadarChart axes={axes} showLabels />);
    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(screen.getByText('Speed')).toBeInTheDocument();
  });
});

describe('ScoreGaugeChart', () => {
  it('renders score display', () => {
    render(<ScoreGaugeChart score={75} label="Score" />);
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
  });

  it('uses color coding for high scores', () => {
    const { container } = render(<ScoreGaugeChart score={90} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('handles score bounds', () => {
    render(<ScoreGaugeChart score={-10} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    render(<ScoreGaugeChart score={150} />);
    expect(screen.getAllByText('100').length).toBeGreaterThan(0);
  });
});

describe('RadialGauge', () => {
  it('renders percentage label', () => {
    render(<RadialGauge value={65} showLabel />);
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('hides label when disabled', () => {
    const { container } = render(<RadialGauge value={50} showLabel={false} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('KPICard', () => {
  it('renders label and value', () => {
    render(<KPICard label="Revenue" value="$1.2M" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$1.2M')).toBeInTheDocument();
  });

  it('renders trend delta', () => {
    const { container } = render(
      <KPICard
        label="Users"
        value="10K"
        delta={{ value: 12.5, trend: 'up', label: 'vs last month' }}
      />,
    );
    expect(container.textContent).toContain('12.5');
    expect(container.textContent).toContain('vs last month');
  });

  it('renders sparkline', () => {
    const { container } = render(
      <KPICard label="Growth" value="150" sparkline={[10, 20, 15, 30, 25, 40]} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

describe('ComparisonMatrix', () => {
  const items = [
    { label: 'Revenue', valueA: '$1M', valueB: '$1.2M', highlight: 'B' as const },
    { label: 'Users', valueA: '10K', valueB: '8K', highlight: 'A' as const },
  ];

  it('renders comparison headers', () => {
    render(<ComparisonMatrix titleA="2024" titleB="2025" items={items} />);
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('renders metric labels', () => {
    render(<ComparisonMatrix items={items} />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });
});
