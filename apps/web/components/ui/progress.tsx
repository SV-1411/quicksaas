'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';

export function Progress({ value }: { value: number }) {
  return (
    <ProgressPrimitive.Root className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
      <ProgressPrimitive.Indicator
        className="h-full bg-primary transition-all"
        style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value))}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
