/**
 * Catálogo declarativo dos fundamentos visuais em uso.
 *
 * Espelha exatamente os valores implementados em `src/styles.css` e nos
 * componentes base — serve como referência legível por código (documentação,
 * páginas de guia, revisões) e NÃO altera nenhum estilo aplicado às telas.
 */

/* ---------------- Cores ---------------- */

export interface DesignColorToken {
  /** Nome do token semântico, sem o prefixo `--color-`. */
  token: string;
  /** Classe utilitária usada como amostra. */
  swatch: string;
  /** Uso recomendado. */
  usage: string;
}

export interface DesignColorGroup {
  id: string;
  title: string;
  description: string;
  tokens: DesignColorToken[];
}

export const colorTokenGroups: DesignColorGroup[] = [
  {
    id: "marca",
    title: "Marca e interação",
    description: "Ações primárias, links, estados ativos e anel de foco.",
    tokens: [
      { token: "primary", swatch: "bg-primary", usage: "Botão primário, ícone ativo" },
      { token: "primary-hover", swatch: "bg-primary-hover", usage: "Hover de ações primárias" },
      { token: "primary-muted", swatch: "bg-primary-muted", usage: "Fundo suave de destaque" },
      { token: "secondary", swatch: "bg-secondary", usage: "Ação secundária" },
      { token: "accent", swatch: "bg-accent", usage: "Hover de itens de menu e ghost" },
      { token: "ring", swatch: "bg-ring", usage: "Anel de foco visível" },
    ],
  },
  {
    id: "superficies",
    title: "Superfícies",
    description: "Camadas de elevação, do fundo da página até sobreposições.",
    tokens: [
      { token: "background", swatch: "bg-background", usage: "Fundo da aplicação" },
      { token: "surface-sunken", swatch: "bg-surface-sunken", usage: "Áreas rebaixadas" },
      { token: "surface-subtle", swatch: "bg-surface-subtle", usage: "Blocos secundários" },
      { token: "card", swatch: "bg-card", usage: "Cards e seções" },
      { token: "surface-raised", swatch: "bg-surface-raised", usage: "Elementos elevados" },
      { token: "popover", swatch: "bg-popover", usage: "Dropdowns, modais, tooltips" },
      { token: "muted", swatch: "bg-muted", usage: "Cabeçalho de tabela, fundos neutros" },
    ],
  },
  {
    id: "texto-bordas",
    title: "Texto e bordas",
    description: "Hierarquia tipográfica por cor e separadores.",
    tokens: [
      { token: "foreground", swatch: "bg-foreground", usage: "Texto principal" },
      {
        token: "muted-foreground",
        swatch: "bg-muted-foreground",
        usage: "Texto de apoio e rótulos",
      },
      { token: "text-subtle", swatch: "bg-text-subtle", usage: "Metadados, placeholders" },
      { token: "text-inverse", swatch: "bg-text-inverse", usage: "Texto sobre fundo forte" },
      {
        token: "ink",
        swatch: "bg-ink",
        usage: "Tinta de documentos impressos (constante nos dois temas)",
      },
      { token: "border", swatch: "bg-border", usage: "Bordas padrão" },
      { token: "border-strong", swatch: "bg-border-strong", usage: "Bordas de ênfase" },
      { token: "input", swatch: "bg-input", usage: "Bordas de controles de formulário" },
    ],
  },
  {
    id: "feedback",
    title: "Feedback",
    description: "Estados de sistema. Sempre acompanhados de texto — nunca cor isolada.",
    tokens: [
      { token: "success", swatch: "bg-success", usage: "Concluído, aprovado" },
      { token: "success-muted", swatch: "bg-success-muted", usage: "Fundo de badge de sucesso" },
      {
        token: "success-strong",
        swatch: "bg-success-strong",
        usage: "Texto de sucesso sobre fundo suave",
      },
      { token: "warning", swatch: "bg-warning", usage: "Pendência, atenção" },
      { token: "warning-muted", swatch: "bg-warning-muted", usage: "Fundo de badge de atenção" },
      {
        token: "warning-strong",
        swatch: "bg-warning-strong",
        usage: "Texto de atenção sobre fundo suave",
      },
      { token: "destructive", swatch: "bg-destructive", usage: "Erro, glosa, exclusão" },
      {
        token: "destructive-strong",
        swatch: "bg-destructive-strong",
        usage: "Texto de erro sobre fundo suave",
      },
      { token: "info", swatch: "bg-info", usage: "Informação neutra" },
      { token: "info-muted", swatch: "bg-info-muted", usage: "Fundo de badge informativo" },
      {
        token: "info-strong",
        swatch: "bg-info-strong",
        usage: "Texto informativo sobre fundo suave",
      },
      { token: "purple", swatch: "bg-purple", usage: "Categoria especial (receita controlada)" },
    ],
  },
  {
    id: "categorica",
    title: "Paleta categórica",
    description: "Séries de gráficos, chips e agrupamentos sem significado semântico.",
    tokens: [
      { token: "cat-1", swatch: "bg-cat-1", usage: "Série 1 (texto: cat-1-fg)" },
      { token: "cat-2", swatch: "bg-cat-2", usage: "Série 2 (texto: cat-2-fg)" },
      { token: "cat-3", swatch: "bg-cat-3", usage: "Série 3 (texto: cat-3-fg)" },
      { token: "cat-4", swatch: "bg-cat-4", usage: "Série 4 (texto: cat-4-fg)" },
      { token: "cat-5", swatch: "bg-cat-5", usage: "Série 5 (texto: cat-5-fg)" },
      { token: "cat-6", swatch: "bg-cat-6", usage: "Série 6 (texto: cat-6-fg)" },
    ],
  },
  {
    id: "navegacao",
    title: "Navegação",
    description: "Sidebar e menu principal.",
    tokens: [
      { token: "sidebar", swatch: "bg-sidebar", usage: "Fundo da navegação" },
      { token: "sidebar-foreground", swatch: "bg-sidebar-foreground", usage: "Texto da navegação" },
      { token: "sidebar-muted", swatch: "bg-sidebar-muted", usage: "Rótulos de grupo" },
      { token: "sidebar-accent", swatch: "bg-sidebar-accent", usage: "Item ativo/hover" },
      { token: "sidebar-border", swatch: "bg-sidebar-border", usage: "Divisórias da navegação" },
    ],
  },
];

/** Escala neutra: origem dos tokens de superfície, borda e texto. */
export const neutralScale = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
] as const;

/**
 * Tokens específicos de domínio devem ser declarados aqui pelo produto que os
 * criar, mantendo o núcleo reutilizável livre de cores de negócio.
 */
export const productSpecificColorTokens = [] as const;

/* ---------------- Tipografia ---------------- */

export interface DesignFontFamily {
  token: string;
  name: string;
  usage: string;
}

export const fontFamilies: DesignFontFamily[] = [
  {
    token: "font-display",
    name: "Plus Jakarta Sans",
    usage: "Títulos (h1–h4), com tracking -0.01em",
  },
  { token: "font-sans", name: "Vazirmatn", usage: "Corpo, rótulos, textos de apoio" },
  {
    token: "font-mono",
    name: "JetBrains Mono",
    usage: "Números, códigos (CID, TUSS, carteira) e trechos técnicos",
  },
];

export interface DesignTypeStyle {
  label: string;
  className: string;
  /** Valores efetivos aplicados (tamanho · peso · altura de linha · cor). */
  spec: string;
}

/** Escala tipográfica tal como está implementada nos componentes base. */
export const typeStyles: DesignTypeStyle[] = [
  {
    label: "Título de página (h1, via PageHeader)",
    className: "font-display text-2xl font-semibold tracking-tight text-foreground",
    spec: "24px · 600 · 32px · foreground",
  },
  {
    label: "Título de seção (h2, via SurfaceCard/SectionCard)",
    className: "font-display text-base font-semibold tracking-tight text-foreground",
    spec: "16px · 600 · 24px · foreground",
  },
  {
    label: "Subtítulo (h3)",
    className: "font-display text-sm font-semibold tracking-tight text-foreground",
    spec: "14px · 600 · 20px · foreground",
  },
  {
    label: "Rótulo de campo (via Field)",
    className: "text-xs font-medium leading-snug text-muted-foreground",
    spec: "12px · 500 · leading-snug · muted-foreground",
  },
  { label: "Corpo", className: "text-sm text-foreground", spec: "14px · 400 · 20px · foreground" },
  {
    label: "Apoio / descrição",
    className: "text-sm text-muted-foreground",
    spec: "14px · 400 · 20px · muted-foreground",
  },
  {
    label: "Metadado / hint",
    className: "text-xs text-muted-foreground",
    spec: "12px · 400 · 16px · muted-foreground",
  },
  {
    label: "Numérico / código",
    className: "font-mono text-sm text-foreground",
    spec: "14px · 400 · tabular por padrão da família",
  },
  {
    label: "Rótulo sobrancelha",
    className: "text-eyebrow",
    spec: "11px · 600 · 16px · caixa alta · tracking 0.05em · muted-foreground",
  },
  {
    label: "Rótulo de métrica",
    className: "metric-label",
    spec: "14px · 400 · 20px · muted-foreground",
  },
  {
    label: "Valor de métrica",
    className: "metric-value",
    spec: "30px · 700 · 36px · tabular-nums",
  },
  { label: "Hint de métrica", className: "metric-hint", spec: "12px · 400 · 16px · tabular-nums" },
];

/* ---------------- Espaçamento, raio, borda, sombra ---------------- */

export interface DesignScaleItem {
  name: string;
  value: string;
  usage: string;
}

export const spacingScale: DesignScaleItem[] = [
  { name: "gap-1.5 / gap-2", value: "6px / 8px", usage: "Ícone + texto, grupos de botões" },
  { name: "gap-3", value: "12px", usage: "Campos relacionados, cabeçalho de card" },
  { name: "gap-4", value: "16px", usage: "Grid de formulário" },
  { name: "space-y-4", value: "16px", usage: "Campos dentro de um card" },
  { name: "space-y-6", value: "24px", usage: "Entre seções da página" },
  { name: "p-4 / p-5 / p-6", value: "16px / 20px / 24px", usage: "Padding de card (sm / md / lg)" },
];

export const radiusScale: DesignScaleItem[] = [
  { name: "rounded-md", value: "calc(0.625rem - 2px)", usage: "Botões, inputs, selects" },
  { name: "rounded-lg", value: "0.625rem", usage: "Ícones em badge, chips, controles quadrados" },
  { name: "rounded-xl", value: "calc(0.625rem + 4px)", usage: "Blocos internos" },
  { name: "rounded-2xl", value: "1rem", usage: "Cards e seções" },
  { name: "rounded-full", value: "9999px", usage: "Badges, pills e avatares" },
];

export const borderScale: DesignScaleItem[] = [
  { name: "border-border", value: "1px", usage: "Bordas padrão de superfícies" },
  { name: "border-input", value: "1px", usage: "Controles de formulário" },
  { name: "border-strong", value: "1px", usage: "Divisórias de ênfase" },
  { name: "border-dashed", value: "1px tracejado", usage: "Áreas vazias e zonas de upload" },
];

export const elevationScale: DesignScaleItem[] = [
  { name: "shadow-xs", value: "sombra mínima", usage: "Cards e seções (padrão)" },
  { name: "shadow-sm", value: "sombra pequena", usage: "Inputs e botões secundários" },
  { name: "shadow", value: "sombra base", usage: "Botão primário" },
  { name: "shadow-md", value: "sombra média", usage: "Dropdowns e popovers" },
  { name: "shadow-lg", value: "sombra grande", usage: "Modais e sobreposições" },
];

/* ---------------- Ícones e alturas de controle ---------------- */

export const iconGuidelines = {
  library: "lucide-react",
  sizes: {
    default: "h-4 w-4 (16px) — botões, campos, itens de menu",
    small: "h-3.5 w-3.5 (14px) — botões `sm`, hints",
    badge: "h-3 w-3 (12px) — badges e pills",
    container: "h-9 w-9 (36px) — moldura arredondada de ícone em cabeçalhos",
  },
  alignment:
    "Aplicar a utility `icon-optical` sempre que o ícone estiver ao lado de texto; ícones decorativos recebem `aria-hidden`.",
} as const;

/** Alturas efetivas dos controles, conforme implementadas hoje. */
export const controlHeights: DesignScaleItem[] = [
  { name: "Button (default)", value: "h-9 (36px)", usage: "Ações padrão em qualquer viewport" },
  {
    name: "Button (sm / lg / icon)",
    value: "h-8 / h-10 / h-9",
    usage: "Ações compactas, destacadas e só-ícone",
  },
  {
    name: "Input / SelectTrigger",
    value: "h-10 no mobile, h-9 a partir de sm",
    usage: "Área de toque maior em telas pequenas (diferença intencional em relação ao Button)",
  },
];
