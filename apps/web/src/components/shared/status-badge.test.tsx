import React from 'react';
import { render, screen } from '@/test-utils';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it('should render status text', () => {
    render(<StatusBadge status="Operational" />);
    expect(screen.getByText('Operational')).toBeInTheDocument();
  });

  it('should use translation when available', () => {
    render(<StatusBadge status="operational" />);
    expect(screen.getByText('Operational')).toBeInTheDocument();
  });

  it('should render raw status when no translation', () => {
    render(<StatusBadge status="custom-status" />);
    expect(screen.getByText('custom-status')).toBeInTheDocument();
  });

  it('should normalize status string', () => {
    render(<StatusBadge status="In Progress" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('should apply success variant for operational', () => {
    render(<StatusBadge status="operational" />);
    const badge = screen.getByText('Operational');
    expect(badge).toHaveAttribute('data-variant', 'success');
  });

  it('should apply warning variant for degraded', () => {
    render(<StatusBadge status="degraded" />);
    const badge = screen.getByText('Degraded');
    expect(badge).toHaveAttribute('data-variant', 'warning');
  });

  it('should apply destructive variant for down', () => {
    render(<StatusBadge status="down" />);
    const badge = screen.getByText('Down');
    expect(badge).toHaveAttribute('data-variant', 'destructive');
  });

  it('should apply outline variant for unknown status', () => {
    render(<StatusBadge status="unknown_status" />);
    const badge = screen.getByText('Unknown Status');
    expect(badge).toHaveAttribute('data-variant', 'outline');
  });

  it('should apply custom className', () => {
    render(<StatusBadge status="active" className="my-custom-class" />);
    const badge = screen.getByText('Active');
    expect(badge.className).toContain('my-custom-class');
  });
});
