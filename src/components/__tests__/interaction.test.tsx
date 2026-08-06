import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Tooltip } from '../Tooltip';
import { Dropdown } from '../Dropdown';
import { DraggableList } from '../DraggableList';
import { FormField } from '../FormField';
import { Select } from '../Select';
import { FocusRing } from '../a11y/FocusRing';
import { SkipToContent } from '../a11y/SkipToContent';

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows tooltip on hover after delay', () => {
    render(
      <Tooltip content="Help text" delayDuration={0}>
        <button>Hover me</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('hides tooltip on mouse leave', () => {
    render(
      <Tooltip content="Help text" delayDuration={0}>
        <button>Hover me</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.mouseLeave(screen.getByText('Hover me'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip on keyboard focus', () => {
    render(
      <Tooltip content="Keyboard tip" delayDuration={0}>
        <button>Focus me</button>
      </Tooltip>,
    );
    fireEvent.focus(screen.getByText('Focus me'));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByText('Keyboard tip')).toBeInTheDocument();
  });

  it('supports different sides', () => {
    render(
      <Tooltip content="Top" side="top" delayDuration={0}>
        <button>Top</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(screen.getByText('Top'));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
  });
});

describe('Dropdown', () => {
  const items = [
    { label: 'Edit', value: 'edit' },
    { label: 'Delete', value: 'delete', danger: true },
    { label: 'Settings', value: 'settings' },
  ];

  it('renders trigger', () => {
    render(
      <Dropdown trigger={<button>Menu</button>} items={items} />,
    );
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('opens menu on click', () => {
    render(
      <Dropdown trigger={<button>Menu</button>} items={items} />,
    );
    fireEvent.click(screen.getByText('Menu'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('selects an item', () => {
    const onSelect = vi.fn();
    render(
      <Dropdown trigger={<button>Menu</button>} items={items} onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByText('Menu'));
    fireEvent.click(screen.getByText('Edit'));
    expect(onSelect).toHaveBeenCalledWith('edit');
  });

  it('has correct ARIA attributes', () => {
    render(
      <Dropdown trigger={<button>Menu</button>} items={items} />,
    );
    const trigger = screen.getByText('Menu');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('does not close on escape when not open', () => {
    render(
      <Dropdown trigger={<button>Menu</button>} items={items} />,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

describe('DraggableList', () => {
  const items = [
    { id: '1', content: 'Item 1' },
    { id: '2', content: 'Item 2' },
    { id: '3', content: 'Item 3' },
  ];

  it('renders all items', () => {
    render(<DraggableList items={items} />);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });
});

describe('FormField', () => {
  it('renders label and input', () => {
    render(
      <FormField label="Email">
        <input type="email" />
      </FormField>,
    );
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(
      <FormField label="Email" error="Required">
        <input type="email" />
      </FormField>,
    );
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders help text', () => {
    render(
      <FormField label="Email" helpText="Enter your work email">
        <input type="email" />
      </FormField>,
    );
    expect(screen.getByText('Enter your work email')).toBeInTheDocument();
  });

  it('marks required fields', () => {
    render(
      <FormField label="Name" required>
        <input type="text" />
      </FormField>,
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});

describe('Select', () => {
  const options = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
  ];

  it('renders options', () => {
    render(<Select options={options} aria-label="Country" />);
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('United Kingdom')).toBeInTheDocument();
  });

  it('calls onValueChange', () => {
    const onValueChange = vi.fn();
    render(<Select options={options} onValueChange={onValueChange} aria-label="Country" />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'uk' } });
    expect(onValueChange).toHaveBeenCalledWith('uk');
  });

  it('shows placeholder', () => {
    render(<Select options={options} placeholder="Choose..." aria-label="Country" />);
    expect(screen.getByText('Choose...')).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    render(<Select options={options} disabled aria-label="Country" />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});

describe('FocusRing', () => {
  it('wraps child element', () => {
    render(
      <FocusRing>
        <button>Focus me</button>
      </FocusRing>,
    );
    expect(screen.getByText('Focus me')).toBeInTheDocument();
  });
});

describe('SkipToContent', () => {
  it('renders visually hidden link', () => {
    render(<SkipToContent targetId="main-content" />);
    const link = screen.getByText('Skip to main content');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#main-content');
  });
});
