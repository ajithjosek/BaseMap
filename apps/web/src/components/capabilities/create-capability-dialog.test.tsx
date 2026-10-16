import React from 'react';
import { render, screen, fireEvent } from '@/test-utils';
import { CreateCapabilityDialog, buildCapabilityPayload } from './create-capability-dialog';

// UI primitives mocked to plain DOM so these tests exercise this dialog's own
// logic, following the mocking style already used in test-utils.
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? <div role="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => {
    const id = (React.Children.toArray(children) as any[]).find((c) => c?.props?.id)?.props?.id;
    return (
      <select id={id} value={value} onChange={(e) => onValueChange?.(e.target.value)}>
        {children}
      </select>
    );
  },
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

describe('buildCapabilityPayload', () => {
  it('coerces the level to a number', () => {
    expect(buildCapabilityPayload({ name: 'Finance', level: '2' }).level).toBe(2);
  });

  it('trims the name', () => {
    expect(buildCapabilityPayload({ name: '  Finance  ', level: 1 }).name).toBe('Finance');
  });

  it('omits blank optional fields', () => {
    const payload = buildCapabilityPayload({
      name: 'Finance',
      level: 1,
      description: '   ',
      strategic_importance: '',
      parent_id: '',
    });
    expect(payload).not.toHaveProperty('description');
    expect(payload).not.toHaveProperty('strategic_importance');
    expect(payload).not.toHaveProperty('parent_id');
  });

  it('keeps the optional fields that were provided', () => {
    expect(
      buildCapabilityPayload({
        name: 'Finance',
        level: 2,
        description: 'Money',
        strategic_importance: 'High',
        parent_id: 'p1',
      }),
    ).toEqual({
      name: 'Finance',
      level: 2,
      description: 'Money',
      strategic_importance: 'High',
      parent_id: 'p1',
    });
  });
});

describe('CreateCapabilityDialog', () => {
  it('submits the entered name with its default level', () => {
    const onSubmit = jest.fn();
    render(<CreateCapabilityDialog open onOpenChange={() => {}} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'Finance' } });
    fireEvent.click(screen.getByRole('button', { name: 'create' }));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Finance', level: 1 });
  });

  it('does not submit an empty name', () => {
    const onSubmit = jest.fn();
    render(<CreateCapabilityDialog open onOpenChange={() => {}} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'create' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders nothing while closed', () => {
    render(<CreateCapabilityDialog open={false} onOpenChange={() => {}} onSubmit={jest.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
