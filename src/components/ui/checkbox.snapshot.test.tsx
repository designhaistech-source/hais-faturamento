import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { Checkbox } from "@/components/ui/checkbox";

/**
 * Snapshots de layout/estados do Checkbox do design system.
 * Falhas indicam mudança visual (classes, estrutura ou indicador) e devem ser revisadas.
 */
describe("Checkbox (snapshots)", () => {
  it("estado padrão (não marcado)", () => {
    const { container } = render(<Checkbox aria-label="Aceitar termos" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("estado marcado", () => {
    const { container } = render(<Checkbox aria-label="Aceitar termos" checked />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("estado indeterminado", () => {
    const { container } = render(
      <Checkbox aria-label="Selecionar todos" checked="indeterminate" />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("estado desabilitado", () => {
    const { container } = render(<Checkbox aria-label="Aceitar termos" disabled />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("estado desabilitado e marcado", () => {
    const { container } = render(<Checkbox aria-label="Aceitar termos" checked disabled />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("com className customizada", () => {
    const { container } = render(<Checkbox aria-label="Aceitar termos" className="h-5 w-5" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
