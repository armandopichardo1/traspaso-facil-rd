import * as React from "react";
import { Input } from "@/components/ui/input";

interface MaskedInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value: string;
  onValueChange: (raw: string) => void;
  mask: "cedula" | "rnc";
}

const MASKS = {
  cedula: { pattern: "___-_______-_", maxRaw: 11, display: "XXX-XXXXXXX-X" },
  rnc: { pattern: "_-__-_____-_", maxRaw: 9, display: "X-XX-XXXXX-X" },
};

function applyMask(raw: string, pattern: string): string {
  let result = "";
  let ri = 0;
  for (let i = 0; i < pattern.length && ri < raw.length; i++) {
    if (pattern[i] === "_") {
      result += raw[ri++];
    } else {
      result += pattern[i];
    }
  }
  return result;
}

function stripMask(value: string): string {
  return value.replace(/\D/g, "");
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ value, onValueChange, mask, ...props }, ref) => {
    const { pattern, maxRaw } = MASKS[mask];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = stripMask(e.target.value).slice(0, maxRaw);
      onValueChange(raw);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter, arrows
      if (["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      // Allow ctrl/cmd combos
      if (e.ctrlKey || e.metaKey) return;
      // Block non-digit
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    };

    const displayed = applyMask(stripMask(value), pattern);

    return (
      <Input
        ref={ref}
        {...props}
        value={displayed}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        inputMode="numeric"
        maxLength={pattern.length}
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";

export { MaskedInput, MASKS };

export function isValidCedula(raw: string): boolean {
  return /^\d{11}$/.test(raw);
}

export function isValidRnc(raw: string): boolean {
  return /^\d{9}$/.test(raw);
}
