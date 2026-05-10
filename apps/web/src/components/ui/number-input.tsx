'use client';

import * as React from 'react';
import { Minus, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NumberInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    min?: number;
    max?: number;
    step?: number;
  }
>(({ className, min, max, step, ...props }, ref) => {
  const [value, setValue] = React.useState<string>(
    props.defaultValue?.toString() || '',
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (props.onChange) {
      props.onChange(e);
    }
  };

  const handleStep = (step: number) => {
    const currentValue = parseFloat(value) || 0;
    const newValue = currentValue + step;
    setValue(newValue.toString());
    if (props.onChange) {
      const event = {
        target: { value: newValue.toString() },
      } as React.ChangeEvent<HTMLInputElement>;
      props.onChange(event);
    }
  };

  return (
    <div className="flex items-center rounded-md border overflow-hidden">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-full px-2"
        onClick={() => handleStep(-(step ?? 1))}
        disabled={min !== undefined && (parseFloat(value) || 0) <= min}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <input
        ref={ref}
        type="number"
        className={cn(
          'flex h-10 w-full items-center justify-center bg-transparent text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        {...props}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-full px-2"
        onClick={() => handleStep(step ?? 1)}
        disabled={max !== undefined && (parseFloat(value) || 0) >= max}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
});
NumberInput.displayName = 'NumberInput';

export { NumberInput };