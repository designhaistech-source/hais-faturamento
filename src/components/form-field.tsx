import * as React from "react";
import { AlertCircle, Loader2, Search as SearchLucide, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ---------------- Field ---------------- */

interface FieldProps {
  id?: string;
  label?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  rightAdornment?: React.ReactNode;
  /**
   * Injeta `id`/`aria-*` no primeiro filho. Desligue quando o filho for um
   * wrapper (ex.: `<div className="relative">`) e o controle real já declarar
   * esses atributos — evita `id` duplicado e `htmlFor` apontando para um div.
   */
  injectChildProps?: boolean;
  children: React.ReactNode;
}

/**
 * Wrapper padrão para campos de formulário.
 * Renderiza label + indicador (obrigatório/opcional) + input + hint/erro.
 * Vincula `htmlFor`/`aria-describedby` automaticamente quando `id` é informado.
 */
export function Field({
  id,
  label,
  required,
  optional,
  hint,
  error,
  className,
  labelClassName,
  rightAdornment,
  injectChildProps = true,
  children,
}: FieldProps) {
  const messageId = id ? `${id}-msg` : undefined;

  // Injeta id + aria-describedby + aria-invalid no primeiro filho quando possível.
  const child =
    injectChildProps && React.isValidElement(children)
      ? React.cloneElement(children as React.ReactElement<any>, {
          id: (children as React.ReactElement<any>).props.id ?? id,
          "aria-invalid":
            (children as React.ReactElement<any>).props["aria-invalid"] ?? Boolean(error),
          "aria-describedby":
            (children as React.ReactElement<any>).props["aria-describedby"] ?? messageId,
        })
      : children;

  return (
    <div className={cn("min-w-0 space-y-1.5 sm:space-y-2", className)}>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            // Escala única: 12px em todas as telas, peso medium e cor muted.
            "flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-xs font-medium leading-snug text-muted-foreground break-words hyphens-auto",
            labelClassName,
          )}
        >
          <span className="min-w-0">{label}</span>
          {required && (
            <span aria-hidden className="text-destructive">
              *
            </span>
          )}
          {optional && !required && (
            <span className="text-[11px] font-normal text-muted-foreground sm:text-xs">
              (opcional)
            </span>
          )}
        </label>
      )}
      {rightAdornment ? (
        <div className="relative">
          {child}
          <span className="icon-optical pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
            {rightAdornment}
          </span>
        </div>
      ) : (
        child
      )}
      {(error || hint) && (
        <p
          id={messageId}
          className={cn(
            "flex min-w-0 items-start gap-1 text-[11px] leading-snug break-words sm:text-xs",
            error ? "text-destructive" : "text-muted-foreground",
          )}
          role={error ? "alert" : undefined}
        >
          {error && <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
          <span className="min-w-0">{error ?? hint}</span>
        </p>
      )}
    </div>
  );
}

/* ---------------- SearchInput ---------------- */

interface SearchInputProps extends Omit<React.ComponentProps<typeof Input>, "type"> {
  leftIcon?: React.ReactNode;
  /** Ações renderizadas à direita (kbd hint, botão limpar custom, etc.). */
  rightSlot?: React.ReactNode;
  /** Mostra botão de limpar quando há valor. Chama onClear (ou dispara onChange com string vazia). */
  clearable?: boolean;
  onClear?: () => void;
  /** Mostra spinner à direita. */
  loading?: boolean;
}

/**
 * Input de busca padronizado com ícone à esquerda.
 * Usa <Input> por baixo, então herda todos os estados (focus, erro, disabled).
 * Suporta `clearable`, `loading` e `rightSlot` para conteúdo customizado (ex.: Kbd).
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    { className, leftIcon, rightSlot, clearable, onClear, loading, onChange, value, ...props },
    ref,
  ) => {
    const hasValue = value !== undefined && value !== null && String(value).length > 0;
    const showClear = clearable && hasValue && !loading;
    const showRight = loading || showClear || rightSlot;

    return (
      <div className="relative w-full">
        <span className="icon-optical pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {leftIcon ?? <SearchLucide className="h-4 w-4" aria-hidden />}
        </span>
        <Input
          ref={ref}
          type="search"
          value={value}
          onChange={onChange}
          className={cn("pl-9", showRight && "pr-9", className)}
          {...props}
        />
        {showRight && (
          <div className="icon-optical absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
            )}
            {showClear && (
              <button /* ds-allow: botão de limpar embutido no Input */
                type="button"
                onClick={() => {
                  onClear?.();
                  if (!onClear && onChange) {
                    onChange({
                      target: { value: "" },
                      currentTarget: { value: "" },
                    } as unknown as React.ChangeEvent<HTMLInputElement>);
                  }
                }}
                aria-label="Limpar busca"
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {rightSlot}
          </div>
        )}
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";

/* ---------------- SearchField ---------------- */

interface SearchFieldProps extends SearchInputProps {
  label?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  fieldClassName?: string;
  labelClassName?: string;
}

/**
 * Campo de busca unificado: label + SearchInput + hint/erro.
 * Padroniza `SearchInput` em toda a aplicação com os mesmos estados que `Field`.
 */
export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  (
    { id, label, required, optional, hint, error, fieldClassName, labelClassName, ...inputProps },
    ref,
  ) => {
    return (
      <Field
        id={id}
        label={label}
        required={required}
        optional={optional}
        hint={hint}
        error={error}
        className={fieldClassName}
        labelClassName={labelClassName}
      >
        <SearchInput ref={ref} id={id} {...inputProps} />
      </Field>
    );
  },
);
SearchField.displayName = "SearchField";

/* ---------------- SelectField ---------------- */

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

interface SelectFieldProps {
  id?: string;
  label?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  triggerClassName?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  placeholder?: React.ReactNode;
  disabled?: boolean;
  /**
   * Somente leitura: renderiza o rótulo da opção escolhida em um input
   * `readOnly` em vez de desabilitar o Select — o valor continua focável,
   * legível por leitores de tela e copiável.
   */
  readOnly?: boolean;
  name?: string;
  /** Lista de opções. Alternativa: passar `children` (SelectItem...) diretamente. */
  options?: SelectOption[];
  children?: React.ReactNode;
}

/**
 * Select padronizado com label + hint/erro.
 * Herda os mesmos tokens (altura h-9, foco, aria-invalid) dos demais campos.
 */
export function SelectField({
  id,
  label,
  required,
  optional,
  hint,
  error,
  className,
  labelClassName,
  triggerClassName,
  value,
  onValueChange,
  defaultValue,
  placeholder,
  disabled,
  readOnly,
  name,
  options,
  children,
}: SelectFieldProps) {
  const messageId = id ? `${id}-msg` : undefined;

  if (readOnly) {
    const selected = options?.find((o) => o.value === value);
    const text = typeof selected?.label === "string" ? selected.label : (value ?? "");
    return (
      <Field
        id={id}
        label={label}
        required={required}
        optional={optional}
        hint={hint}
        error={error}
        className={className}
        labelClassName={labelClassName}
        injectChildProps={false}
      >
        <Input
          id={id}
          readOnly
          aria-readonly="true"
          aria-describedby={messageId}
          value={text}
          placeholder={typeof placeholder === "string" ? placeholder : undefined}
        />
      </Field>
    );
  }

  return (
    <Field
      id={id}
      label={label}
      required={required}
      optional={optional}
      hint={hint}
      error={error}
      className={className}
      labelClassName={labelClassName}
    >
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        name={name}
      >
        <SelectTrigger
          id={id}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={messageId}
          className={triggerClassName}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options
            ? options.map((o) => (
                <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
                  {o.label}
                </SelectItem>
              ))
            : children}
        </SelectContent>
      </Select>
    </Field>
  );
}
