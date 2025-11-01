"use client";

import React, { ReactNode } from "react";

export interface ButtonOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface ButtonGroupRadioProps<T extends string> {
  options: ButtonOption<T>[];
  value: T;
  onChange: (value: T) => void;
  name: string;
  variant?: "primary" | "secondary";
  className?: string;
}

/**
 * Reusable button group component with consistent styling using radio inputs for better form integration
 * - Primary variant: Full-sized buttons (for main controls like chart view, filters)
 * - Secondary variant: Compact buttons (for auxiliary controls like meter readings toggle)
 */
export function ButtonGroupRadio<T extends string>({
  options,
  value,
  onChange,
  name,
  variant = "primary",
  className = "",
}: ButtonGroupRadioProps<T>) {
  const isPrimary = variant === "primary";

  const buttonBaseClasses = isPrimary
    ? "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
    : "flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer";

  const activeClasses = isPrimary
    ? "bg-primary text-primary-foreground shadow-md"
    : "bg-primary text-primary-foreground shadow-sm";

  const inactiveClasses = isPrimary
    ? "bg-transparent text-foreground border-2 border-border hover:border-primary/50 hover:bg-primary/5"
    : "bg-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground";

  const containerClasses = isPrimary
    ? `flex flex-wrap gap-2 ${className}`
    : `flex gap-1 bg-secondary/10 rounded-md p-1 border border-border/50 ${className}`;

  return (
    <div className={containerClasses}>
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <label
            key={option.value}
            className={`${buttonBaseClasses} ${isActive ? activeClasses : inactiveClasses}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isActive}
              onChange={(e) => onChange(e.target.value as T)}
              className="hidden"
            />
            {option.icon}
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
