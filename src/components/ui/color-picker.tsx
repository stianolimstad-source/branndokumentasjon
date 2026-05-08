import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#1A4D8C", "#0F172A", "#1E40AF", "#0369A1",
  "#3B82F6", "#0EA5E9", "#06B6D4", "#10B981",
  "#F97316", "#EA580C", "#DC2626", "#B91C1C",
  "#7C3AED", "#9333EA", "#DB2777", "#0F766E",
  "#111111", "#374151", "#6B7280", "#FFFFFF",
];

const ensureHash = (c: string) => (c.startsWith("#") ? c : `#${c}`);
const isValidHex = (c: string) => /^#[0-9A-Fa-f]{6}$/.test(c);

interface Props {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value);

  const commitHex = (v: string) => {
    const normalized = ensureHash(v.trim());
    if (isValidHex(normalized)) onChange(normalized.toUpperCase());
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-10 w-14 rounded border-2 border-border cursor-pointer hover:border-primary transition shrink-0",
            className,
          )}
          style={{ background: value }}
          aria-label="Velg farge"
        />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="grid grid-cols-5 gap-2 mb-3">
          {PRESET_COLORS.map((c) => {
            const selected = c.toUpperCase() === value.toUpperCase();
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange(c);
                  setHexInput(c);
                }}
                className="relative h-8 w-8 rounded border border-border hover:scale-110 transition"
                style={{ background: c }}
                aria-label={c}
              >
                {selected && (
                  <Check
                    className="absolute inset-0 m-auto h-4 w-4"
                    style={{ color: c === "#FFFFFF" ? "#000" : "#fff" }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Egendefinert hex</label>
          <Input
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            onBlur={(e) => commitHex(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitHex(hexInput);
                setOpen(false);
              }
            }}
            placeholder="#1A4D8C"
            className="font-mono uppercase h-8"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
