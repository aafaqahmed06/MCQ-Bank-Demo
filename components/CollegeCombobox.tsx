"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { College } from "@/components/useCollegeOptions";
import { cn } from "@/components/ui";

type CollegeComboboxProps = {
  colleges: College[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className: string;
  inputId?: string;
};

/**
 * Searchable college picker -- a plain <select> stops being usable once the
 * list holds ~125 colleges. No combobox library is installed in this repo,
 * so this is a small, dependency-free implementation of the standard
 * combobox pattern (text input + filtered listbox), matching this form's
 * existing input styling via the `className` prop rather than introducing
 * a new visual style.
 */
export default function CollegeCombobox({
  colleges,
  value,
  onChange,
  placeholder = "Search for your college…",
  className,
  inputId,
}: CollegeComboboxProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selected = useMemo(
    () => colleges.find((c) => c.id === value) ?? null,
    [colleges, value],
  );

  // Keep the displayed text in sync with the selected college whenever
  // `value` changes from outside this component (e.g. ProfileEditor
  // populating it once the user's saved profile loads) -- adjusted during
  // render rather than in an effect, per React's guidance for "reset state
  // when a prop changes" (react.dev/learn/you-might-not-need-an-effect).
  // While the dropdown is open the query is the user's own in-progress text,
  // so this only applies while closed.
  const [syncedValue, setSyncedValue] = useState(value);
  if (!open && value !== syncedValue) {
    setSyncedValue(value);
    setQuery(selected?.name ?? "");
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return colleges;
    return colleges.filter((c) =>
      [c.name, c.short_name, c.city].some((field) =>
        field?.toLowerCase().includes(q),
      ),
    );
  }, [colleges, query]);

  function selectCollege(college: College) {
    onChange(college.id);
    setQuery(college.name);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleBlur() {
    // Let a click on an option (onMouseDown below) register before this
    // closes the list; otherwise revert the text to the real selection so
    // displayed text never drifts from `value`.
    window.setTimeout(() => {
      setOpen(false);
      setQuery(selected?.name ?? "");
    }, 100);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && activeIndex >= 0 && filtered[activeIndex]) {
        e.preventDefault();
        selectCollege(filtered[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery(selected?.name ?? "");
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
        }
        autoComplete="off"
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
          if (value) onChange("");
        }}
        className={className}
      />
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-control border border-border-default bg-surface-elevated py-1 shadow-elevated"
        >
          {filtered.length === 0 && (
            <li className="px-4 py-2.5 text-sm text-text-tertiary">
              No colleges match &quot;{query}&quot;.
            </li>
          )}
          {filtered.map((c, i) => (
            <li
              key={c.id}
              id={`${listboxId}-${i}`}
              role="option"
              aria-selected={c.id === value}
              onMouseDown={(e) => {
                e.preventDefault();
                selectCollege(c);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                "cursor-pointer px-4 py-2.5 text-sm",
                i === activeIndex ? "bg-primary/12 text-primary" : "text-text-secondary"
              )}
            >
              <span>{c.name}</span>
              {(c.short_name || c.city) && (
                <span className="ml-1.5 text-xs text-text-tertiary">
                  {[c.short_name, c.city].filter(Boolean).join(" · ")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
