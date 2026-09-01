import React from 'react';
import { render, screen } from '@/test-utils';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('should render message', () => {
    render(<EmptyState message="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('should render default Inbox icon', () => {
    const { container } = render(<EmptyState message="Empty" />);
    const iconContainer = container.querySelector('[aria-hidden="true"]');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should render custom icon when provided', () => {
    const customIcon = <span data-testid="custom-icon">Star</span>;
    render(<EmptyState message="Empty" icon={customIcon} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('should render children when provided', () => {
    render(
      <EmptyState message="No data">
        <button>Create New</button>
      </EmptyState>,
    );
    expect(screen.getByRole('button', { name: 'Create New' })).toBeInTheDocument();
  });

  it('should not render children slot when no children', () => {
    const { container } = render(<EmptyState message="Empty" />);
    expect(container.querySelector('.mt-4')).not.toBeInTheDocument();
  });
});
