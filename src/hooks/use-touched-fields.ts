import { useCallback, useState } from "react";

/**
 * Controla quais campos já foram interagidos (blur/tap) para que mensagens de
 * erro e estados visuais de inválido só apareçam após a interação do usuário.
 */
export function useTouchedFields<TField extends string>() {
  const [touched, setTouched] = useState<Partial<Record<TField, boolean>>>({});

  const markTouched = useCallback((field: TField) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }, []);

  const isTouched = useCallback((field: TField) => Boolean(touched[field]), [touched]);

  /** Retorna o erro apenas quando o campo já foi tocado. */
  const errorFor = useCallback(
    (field: TField, error?: string | false | null) => (touched[field] && error ? error : undefined),
    [touched],
  );

  const resetTouched = useCallback(() => setTouched({}), []);

  /** Marca todos os campos informados como tocados (ex.: ao submeter). */
  const touchAll = useCallback((fields: readonly TField[]) => {
    setTouched(
      fields.reduce<Partial<Record<TField, boolean>>>((acc, field) => {
        acc[field] = true;
        return acc;
      }, {}),
    );
  }, []);

  return { touched, markTouched, isTouched, errorFor, resetTouched, touchAll };
}
