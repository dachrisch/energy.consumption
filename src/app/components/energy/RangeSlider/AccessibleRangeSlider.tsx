"use client";

import * as Slider from "@radix-ui/react-slider";

interface AccessibleRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
}

const AccessibleRangeSlider = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  className = "",
}: AccessibleRangeSliderProps) => {
  return (
    <Slider.Root
      className={`relative flex items-center select-none touch-none w-full h-10 ${className}`}
      value={value}
      min={min}
      max={max}
      step={step}
      onValueChange={(val) => onChange(val as [number, number])}
      aria-label="Date range slider"
    >
      <Slider.Track className="bg-secondary relative grow rounded-full h-1.5 overflow-hidden border border-border/30">
        <Slider.Range className="absolute bg-primary rounded-full h-full" />
      </Slider.Track>
      
      <Slider.Thumb
        className="block w-6 h-6 bg-primary shadow-lg rounded-full hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all cursor-grab active:cursor-grabbing border-2 border-primary-foreground"
        aria-label="Start date"
      />
      
      <Slider.Thumb
        className="block w-6 h-6 bg-primary shadow-lg rounded-full hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all cursor-grab active:cursor-grabbing border-2 border-primary-foreground"
        aria-label="End date"
      />
    </Slider.Root>
  );
};

export default AccessibleRangeSlider;
