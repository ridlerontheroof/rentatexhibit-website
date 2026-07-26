import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    /** Accessible name per thumb (range sliders: [min, max]). */
    thumbLabels?: string[];
  }
>(({ className, thumbLabels, ...props }, ref) => {
  // One thumb per value: a range slider (two values) must render two thumbs,
  // otherwise the second value has no thumb carrying aria-valuenow and the
  // control fails accessibility checks.
  // Radix only applies aria-valuenow after hydration; mirror the value here so
  // the prerendered (SSR) markup already carries it and passes static a11y audits.
  const values = props.value ?? props.defaultValue ?? [0];
  const thumbCount = values.length;
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-valuenow={values[i]}
          aria-valuemin={props.min}
          aria-valuemax={props.max}
          aria-label={
            thumbLabels?.[i] ??
            (thumbCount > 1 ? (i === 0 ? 'Minimum value' : 'Maximum value') : undefined)
          }
          className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
