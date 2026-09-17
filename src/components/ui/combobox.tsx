"use client";

import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  /** Texto usado na busca; por padrão considera label + value. */
  searchText?: string;
  disabled?: boolean;
}

/* -------- shared trigger (mesma altura/estilos do Select/Input) -------- */

interface TriggerProps extends React.ComponentPropsWithoutRef<"button"> {
  invalid?: boolean;
  placeholder?: boolean;
}

const triggerBase = cn(
  "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors",
  "hover:bg-accent/30",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

const ComboboxTrigger = React.forwardRef<HTMLButtonElement, TriggerProps>(
  ({ className, invalid, placeholder, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-invalid={invalid || undefined}
      data-placeholder={placeholder || undefined}
      className={cn(
        triggerBase,
        "data-[placeholder]:text-muted-foreground",
        invalid && "border-destructive/60 focus-visible:ring-destructive/30",
        className,
      )}
      {...props}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2 text-left [&>span]:line-clamp-1">
        {children}
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
    </button>
  ),
);
ComboboxTrigger.displayName = "ComboboxTrigger";

/* -------------------- Combobox (single, searchable) -------------------- */

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  invalid?: boolean;
  clearable?: boolean;
  /** Rótulo de uma opção no topo da lista que limpa a seleção (ex.: "Todas as operadoras"). */
  allOptionLabel?: string;
  className?: string;
  id?: string;
  "aria-describedby"?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado.",
  disabled,
  invalid,
  clearable,
  allOptionLabel,
  className,
  id,
  ...aria
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ComboboxTrigger
          id={id}
          disabled={disabled}
          invalid={invalid}
          placeholder={!selected}
          className={className}
          aria-expanded={open}
          {...aria}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          {clearable && selected && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange?.("");
              }}
              className="ml-auto -mr-1 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Limpar seleção"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </ComboboxTrigger>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {allOptionLabel && (
                <CommandItem
                  value={allOptionLabel}
                  onSelect={() => {
                    onChange?.("");
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Check className={cn("h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{allOptionLabel}</span>
                </CommandItem>
              )}
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.searchText ?? `${opt.label} ${opt.value}`}
                    disabled={opt.disabled}
                    onSelect={() => {
                      onChange?.(opt.value);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Check className={cn("h-4 w-4", active ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          {opt.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* -------------------- MultiSelect (search + multi) -------------------- */

interface MultiSelectProps {
  options: ComboboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  allLabel?: string;
  emptyLabel?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  id?: string;
  showActions?: boolean;
  countLabel?: (n: number) => string;
  /** Exibe as seleções como chips removíveis dentro do próprio campo. */
  chips?: boolean;
  /** Rótulo do chip (por padrão, o label da opção). */
  chipLabel?: (option: ComboboxOption) => string;
  /** Máximo de chips visíveis antes de agrupar o restante em "+N". */
  maxChips?: number;
}

export function MultiSelect({
  options,
  values,
  onChange,
  placeholder = "Selecione...",
  allLabel = "Todos",
  emptyLabel = "Nenhum",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado.",
  disabled,
  invalid,
  className,
  id,
  showActions = true,
  countLabel = (n) => `${n} selecionados`,
  chips = false,
  chipLabel,
  maxChips = 2,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const set = React.useMemo(() => new Set(values), [values]);

  const toggle = (v: string) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(Array.from(next));
  };

  const label =
    values.length === 0
      ? emptyLabel
      : values.length === options.length
        ? allLabel
        : values.length === 1
          ? (options.find((o) => o.value === values[0])?.label ?? countLabel(1))
          : countLabel(values.length);

  const isPlaceholder = values.length === 0;

  const selectedOptions = values
    .map((v) => options.find((o) => o.value === v))
    .filter((o): o is ComboboxOption => Boolean(o));

  // Mede a largura real dos chips para exibir o máximo que couber no campo.
  const chipsRowRef = React.useRef<HTMLSpanElement>(null);
  const measureRowRef = React.useRef<HTMLSpanElement>(null);
  const [visibleCount, setVisibleCount] = React.useState(selectedOptions.length);

  const selectedKey = selectedOptions.map((o) => o.value).join("|");

  React.useLayoutEffect(() => {
    if (!chips) return;
    const row = chipsRowRef.current;
    const measure = measureRowRef.current;
    if (!row || !measure) return;

    const compute = () => {
      const available = row.clientWidth;
      const widths = Array.from(measure.children).map(
        (el) => (el as HTMLElement).getBoundingClientRect().width,
      );
      const gap = 6;
      const overflowBadge = 40;
      let used = 0;
      let count = 0;
      for (let i = 0; i < widths.length; i += 1) {
        const next = used + (i === 0 ? 0 : gap) + widths[i];
        const rest = i < widths.length - 1 ? gap + overflowBadge : 0;
        if (next + rest > available && count > 0) break;
        used = next;
        count = i + 1;
      }
      setVisibleCount(Math.max(1, count));
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(row);
    return () => observer.disconnect();
  }, [chips, selectedKey]);

  const effectiveMax = chips ? Math.min(visibleCount, maxChips * 100) : maxChips;
  const visibleChips = selectedOptions.slice(0, effectiveMax);
  const hiddenChips = selectedOptions.length - visibleChips.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {chips ? (
          // Campo com chips: o gatilho é um contêiner para permitir botões de
          // remoção acessíveis dentro dele (botão dentro de botão é inválido).
          <div
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-invalid={invalid || undefined}
            tabIndex={disabled ? -1 : 0}
            data-placeholder={isPlaceholder || undefined}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setOpen(!open);
              }
            }}
            className={cn(
              triggerBase,
              "cursor-pointer overflow-hidden data-[placeholder]:text-muted-foreground",
              invalid && "border-destructive/60 focus-visible:ring-destructive/30",
              disabled && "pointer-events-none opacity-50",
              className,
            )}
          >
            <span
              ref={chipsRowRef}
              className="relative flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-left"
            >
              {isPlaceholder ? (
                <span className="truncate">{placeholder}</span>
              ) : (
                <>
                  {visibleChips.map((option) => (
                    <span
                      key={option.value}
                      className="inline-flex min-w-0 max-w-xs shrink-0 items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-primary"
                    >
                      <span className="truncate">
                        {chipLabel ? chipLabel(option) : option.label}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remover ${chipLabel ? chipLabel(option) : option.label}`}
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          onChange(values.filter((v) => v !== option.value));
                        }}
                        className="rounded-full text-primary/70 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                  {hiddenChips > 0 && (
                    <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-card px-2 py-0.5 text-xs text-foreground">
                      +{hiddenChips}
                    </span>
                  )}
                  {/* Linha oculta usada apenas para medir a largura real dos chips. */}
                  <span
                    ref={measureRowRef}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 top-0 flex items-center gap-1.5 opacity-0"
                  >
                    {selectedOptions.map((option) => (
                      <span
                        key={option.value}
                        className="inline-flex max-w-xs shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                      >
                        <span className="truncate">
                          {chipLabel ? chipLabel(option) : option.label}
                        </span>
                        <X className="h-3 w-3" aria-hidden="true" />
                      </span>
                    ))}
                  </span>
                </>
              )}
            </span>

            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
          </div>
        ) : (
          <ComboboxTrigger
            id={id}
            disabled={disabled}
            invalid={invalid}
            placeholder={isPlaceholder}
            className={className}
            aria-expanded={open}
          >
            <span className="truncate">{isPlaceholder ? placeholder : label}</span>
          </ComboboxTrigger>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
        className="flex max-h-(--radix-popover-content-available-height) w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) flex-col overflow-hidden p-0"
      >
        <Command className="flex max-h-full flex-col overflow-hidden">
          <CommandInput placeholder={searchPlaceholder} />

          {showActions && (
            <div className="flex items-center justify-between border-b border-border px-2 py-1.5 text-xs">
              <span className="text-muted-foreground">
                {values.length} de {options.length} selecionados
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onChange(options.map((o) => o.value))}
                  className="rounded-md px-2 py-0.5 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                >
                  Todos
                </button>
                <span className="text-muted-foreground/40">·</span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="rounded-md px-2 py-0.5 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                >
                  Limpar
                </button>
              </div>
            </div>
          )}
          <CommandList className="max-h-none flex-1 overflow-y-auto">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const active = set.has(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.searchText ?? `${opt.label} ${opt.value}`}
                    disabled={opt.disabled}
                    onSelect={() => toggle(opt.value)}
                    aria-selected={active}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 py-1.5",
                      "data-[selected=true]:bg-muted/60 data-[selected=true]:text-foreground",
                      active && "bg-primary/5",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background",
                      )}
                    >
                      {active && <Check className="h-3 w-3" />}
                    </span>
                    <span className="flex min-w-0 flex-1 items-baseline gap-2">
                      <span
                        className={cn("truncate text-sm text-foreground", active && "font-medium")}
                      >
                        {opt.label}
                      </span>
                      {opt.description && (
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {opt.description}
                        </span>
                      )}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* Re-export helper for search icon consumers */
export { Search as ComboboxSearchIcon };
