"use client";

import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "lucide-react";
import type { LessonFilter } from "../../helpers/constants";
import { dashboardHref } from "@/lib/routes";

interface Props {
  initialQuery: string;
  status: LessonFilter;
  onNavigate: (href: string) => void;
}

const LessonsSearch = ({ initialQuery, status, onNavigate }: Props) => {
  const [value, setValue] = useState(initialQuery);
  const [lastInitial, setLastInitial] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  if (initialQuery !== lastInitial) {
    setLastInitial(initialQuery);
    if (!focused) setValue(initialQuery);
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const onChange = (next: string) => {
    setValue(next);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onNavigate(dashboardHref({ status, q: next.trim() }));
    }, 300);
  };

  return (
    <div className="border-border-subtle bg-surface focus-within:border-accent-brand focus-within:ring-accent-brand/15 flex h-8 w-full items-center gap-2 rounded-lg border px-3 transition-[border-color,box-shadow] focus-within:ring-3 sm:w-70">
      <SearchIcon
        className="text-text-tertiary size-3.5 shrink-0"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        maxLength={120}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search lessons or students"
        aria-label="Search lessons or students"
        className="text-text-primary placeholder:text-text-tertiary min-w-0 flex-1 border-none bg-transparent p-0 text-[13px] outline-none"
      />
      <kbd
        aria-hidden="true"
        className="text-text-tertiary border-border-subtle hidden rounded border px-1 font-mono text-[11px] sm:inline"
      >
        ⌘K
      </kbd>
    </div>
  );
};

export default LessonsSearch;
