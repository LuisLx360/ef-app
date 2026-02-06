// src/components/ui/select-radix.tsx
import * as React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "./utils";

interface Option {
  value: string;
  label: string;
}

interface SelectRadixProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: Option[];
  className?: string;
}

export function SelectRadix({
  value,
  onValueChange,
  placeholder = "Selecciona una opción...",
  options,
  className,
}: SelectRadixProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange}>
      {/* Trigger */}
      <RadixSelect.Trigger
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 hover:shadow-md",
          className
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      {/* Dropdown */}
      <RadixSelect.Portal>
        <RadixSelect.Content
          className="z-50 mt-1 w-full min-w-[8rem] max-h-60 overflow-auto rounded-md border bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5"
        >
          <RadixSelect.Viewport>
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-3 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
                  "data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-900 data-[state=checked]:border-r-2 data-[state=checked]:border-blue-500"
                )}
              >
                <RadixSelect.ItemIndicator className="absolute left-2.5">
                  <Check className="h-4 w-4 text-blue-600" />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
