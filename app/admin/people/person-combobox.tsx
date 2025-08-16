"use client";

import * as React from "react";
import { ChevronsUpDown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type PersonOption = { id: string; name: string; slug: string };

export function PersonCombobox({
  name,
  label,
  options,
  defaultValue = "",
  placeholder = "Select person…",
  disabled = false,
}: {
  name: string;
  label: string;
  options: PersonOption[];
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(defaultValue);

  const selected = React.useMemo(
    () => options.find(o => o.id === value) || null,
    [options, value]
  );

  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium">{label}</label>

      {/* Hidden input so form submits the selected id */}
      <input type="hidden" name={name} value={value} />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selected ? (
              <span className="truncate">
                {selected.name} <span className="text-muted-foreground">({selected.slug})</span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0">
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}…`} className="h-9" />
            <CommandList>
              <CommandEmpty>No person found.</CommandEmpty>
              <CommandGroup>
                {options.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={`${p.name} ${p.slug}`}
                    onSelect={() => {
                      setValue(p.id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Check className={cn("size-4", value === p.id ? "opacity-100" : "opacity-0")} />
                      <span className="truncate">{p.name}</span>
                      <span className="text-muted-foreground truncate">({p.slug})</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground self-start"
        >
          <X className="size-3" /> Clear {label.toLowerCase()}
        </button>
      )}
    </div>
  );
}
