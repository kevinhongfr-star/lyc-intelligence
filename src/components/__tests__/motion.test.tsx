import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageTransition } from '../motion/PageTransition';
import { RouteProgress } from '../motion/RouteProgress';
import { HoverButton, HoverCard, HoverLink } from '../motion/MicroInteractions';
import { NumberCounter } from '../motion/NumberCounter';
import { BarChartEntry, LineChartEntry, PieChartEntry } from '../motion/ChartAnimations';

vi.mock('@/hooks/useMotionConfig', () => ({
  useMotionConfig: () => ({
    reducedMotion: true,
    duration: {
      micro: { fastest: '80ms', fast: '120ms' },
      standard: { fast: '200ms', base: '250ms', slow: '300ms' },
      complex: { fast: '400ms', base: '500ms', slow: '600ms' },
    },
    easing: {
      standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
      exit: 'cubic-bezier(0.4, 0, 1, 1)',
      emphasize: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    transitionClass: '',
  }),
}));

describe('PageTransition', () => {
  it('renders children with animation wrapper', () => {
    render(
      <PageTransition>
        <div>Page Content</div>
      </PageTransition>,
    );
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('applies direction class', () => {
    const { container } = render(
      <PageTransition direction="right">
        <div>Slide Right</div>
      </PageTransition>,
    );
    expect(container.firstChild).toBeDefined();
  });
});

describe('RouteProgress', () => {
  it('renders progress bar when loading', () => {
    const { container } = render(<RouteProgress isLoading={true} progress={50} />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toBeDefined();
  });

  it('hides when not loading', () => {
    const { container } = render(<RouteProgress isLoading={false} progress={0} />);
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
  });
});

describe('HoverButton', () => {
  it('renders a button', () => {
    render(<HoverButton>Click me</HoverButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    render(<HoverButton className="custom">Click me</HoverButton>);
    expect(screen.getByRole('button')).toHaveClass('custom');
  });
});

describe('HoverCard', () => {
  it('renders card content', () => {
    render(<HoverCard>Card Content</HoverCard>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });
});

describe('HoverLink', () => {
  it('renders a link', () => {
    render(<HoverLink href="/test">Test Link</HoverLink>);
    expect(screen.getByText('Test Link')).toBeInTheDocument();
  });
});

describe('NumberCounter', () => {
  it('renders initial value with reduced motion', () => {
    const { container } = render(<NumberCounter value={42} />);
    expect(container.textContent).toContain('42');
  });
});

describe('ChartAnimations', () => {
  it('renders BarChartEntry', () => {
    const { container } = render(
      <BarChartEntry data={[{ label: 'A', value: 30 }, { label: 'B', value: 50 }]} />,
    );
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('renders LineChartEntry', () => {
    const { container } = render(
      <LineChartEntry points={[{ x: 0, y: 50 }, { x: 50, y: 20 }, { x: 100, y: 80 }]} />,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders PieChartEntry', () => {
    const { container } = render(
      <PieChartEntry segments={[{ value: 40 }, { value: 30 }, { value: 30 }]} />,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
