"use client";

import { CaretDown } from "@phosphor-icons/react";
import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField(
    { label, hint, options, id, className = "", ...props },
    ref,
  ) {
    return (
      <div className={className}>
        <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink">
          {label}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={id}
            aria-describedby={hint ? `${id}-hint` : undefined}
            className="h-11 w-full appearance-none border border-line bg-surface-2 px-3 pr-10 text-base text-ink transition-colors duration-200 ease-(--ease-out-quart) focus:border-accent focus:outline-none"
            {...props}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <CaretDown
            size={16}
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
        </div>
        {hint && (
          <p id={`${id}-hint`} className="mt-2 text-sm text-ink-muted">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
