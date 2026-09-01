import React from 'react';
import { render, screen } from '@/test-utils';
import { PageHeader } from './page-header';

describe('PageHeader', () => {
  it('should render title', () => {
    render(<PageHeader title="Applications" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Applications');
  });

  it('should render subtitle when provided', () => {
    render(<PageHeader title="Apps" subtitle="Manage your applications" />);
    expect(screen.getByText('Manage your applications')).toBeInTheDocument();
  });

  it('should not render subtitle when not provided', () => {
    render(<PageHeader title="Apps" />);
    expect(screen.queryByText('Manage')).not.toBeInTheDocument();
  });

  it('should render children actions', () => {
    render(
      <PageHeader title="Apps">
        <button>Add App</button>
      </PageHeader>,
    );
    expect(screen.getByRole('button', { name: 'Add App' })).toBeInTheDocument();
  });

  it('should not render action slot when no children', () => {
    const { container } = render(<PageHeader title="Apps" />);
    expect(container.querySelector('.flex.items-center.gap-2')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<PageHeader title="Apps" className="my-class" />);
    expect(container.firstChild).toHaveClass('my-class');
  });
});
