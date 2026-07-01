"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface Props extends Omit<
  React.ComponentPropsWithoutRef<"input">,
  "prefix"
> {
  label?: string;
  helper?: string;
  error?: string;
  optional?: boolean;
  prefix?: string;
  containerClassName?: string;
}

const Input = ({
  label,
  helper,
  error,
  optional = false,
  prefix,
  id,
  className,
  containerClassName,
  ...props
}: Props) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;
  const message = error ?? helper;

  return (
    <div className={cn("w-full", containerClassName)}>
      {label && (
        <div className="mb-1.5 flex items-baseline justify-between">
          <label
            htmlFor={inputId}
            className="text-text-primary text-[13px] font-medium tracking-[-0.005em]"
          >
            {label}
          </label>
          {optional && (
            <span className="text-text-tertiary text-xs">Optional</span>
          )}
        </div>
      )}
      <div
        className={cn(
          "bg-surface flex h-10 items-center rounded-sm border px-3 transition-[border-color,box-shadow] duration-150",
          "focus-within:ring-3",
          error
            ? "border-destructive focus-within:border-destructive focus-within:ring-destructive/15"
            : "border-border-subtle focus-within:border-accent-brand focus-within:ring-accent-brand/15",
        )}
      >
        {prefix && (
          <span className="text-text-tertiary mr-1 font-mono text-[13.5px]">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? descriptionId : undefined}
          className={cn(
            "text-text-primary placeholder:text-text-tertiary min-w-0 flex-1 border-none bg-transparent p-0 text-sm tracking-[-0.005em] outline-none",
            className,
          )}
          {...props}
        />
      </div>
      {message && (
        <p
          id={descriptionId}
          className={cn(
            "mt-1.5 text-[12.5px] leading-snug",
            error ? "text-destructive" : "text-text-tertiary",
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default Input;
