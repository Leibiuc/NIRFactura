"use client";

import { useState } from "react";
import { parseDecimal, snapStep } from "@/lib/number-step";
import { cn } from "./cn";
import { Input } from "./Input";

interface Props {
  /** Effective numeric value shown when the cell is not being edited. */
  value: number | undefined;
  /** Called with the raw string on every keystroke and on each arrow step. */
  onCommit: (raw: string) => void;
  min?: number;
  step?: number;
  className?: string;
}

const show = (v: number | undefined) => (v == null ? "" : String(v));

/**
 * Spreadsheet-style numeric cell: fully free-form text entry (so partial input
 * like "5." and decimal commas survive keystrokes), with up/down arrows — both
 * the keyboard keys and the hover spinner — stepping by `step` (default 0.5).
 */
export function NumberInput({ value, onCommit, min = 0, step = 0.5, className }: Props) {
  // While focused we keep the raw text in `draft` so the field shows exactly
  // what was typed; on blur we drop it and fall back to the formatted value.
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? show(value);

  const stepBy = (dir: 1 | -1) => {
    const base = (draft != null ? parseDecimal(draft) : value) ?? 0;
    const next = snapStep(base, dir, step, min);
    setDraft(null);
    onCommit(String(next));
  };

  return (
    <div className="group relative">
      <Input
        variant="cell"
        type="text"
        inputMode="decimal"
        className={cn("pr-4 text-right", className)}
        value={display}
        onChange={(e) => {
          setDraft(e.target.value);
          onCommit(e.target.value);
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            stepBy(1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            stepBy(-1);
          }
        }}
      />
      <span className="pointer-events-none absolute inset-y-0 right-0.5 flex flex-col justify-center opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        {([1, -1] as const).map((dir) => (
          <button
            key={dir}
            type="button"
            tabIndex={-1}
            aria-label={dir > 0 ? "Mareste" : "Micsoreaza"}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => stepBy(dir)}
            className="pointer-events-auto flex h-3 w-3 items-center justify-center text-[8px] leading-none text-gray-400 hover:text-gray-700"
          >
            {dir > 0 ? "▲" : "▼"}
          </button>
        ))}
      </span>
    </div>
  );
}
