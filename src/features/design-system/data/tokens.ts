export interface ColorToken {
  /** Nome do token semântico (sem prefixo --color-) */
  name: string;
  /** Classe utilitária de background usada como amostra */
  swatch: string;
  /** Uso recomendado */
  usage: string;
}

export interface TokenGroup {
  title: string;
  description: string;
  tokens: ColorToken[];
}

export const colorGroups: TokenGroup[] = [
  {
    title: "Marca",
    description:
      "Cor institucional HaisFaturamento. Usada em ações primárias, links e estados ativos.",
    tokens: [
      { name: "primary", swatch: "bg-primary", usage: "Botão primário, ícone ativo" },
      { name: "primary-hover", swatch: "bg-primary-hover", usage: "Hover de ações primárias" },
      { name: "primary-muted", swatch: "bg-primary-muted", usage: "Fundo suave de destaque" },
      { name: "accent", swatch: "bg-accent", usage: "Hover de itens de menu" },
      { name: "ring", swatch: "bg-ring", usage: "Anel de foco" },
    ],
  },
  {
    title: "Superfícies",
    description: "Camadas de elevação. Do fundo da página até overlays (modais e popovers).",
    tokens: [
      { name: "background", swatch: "bg-background", usage: "Fundo da aplicação" },
      { name: "surface-subtle", swatch: "bg-surface-subtle", usage: "Blocos secundários" },
      { name: "card", swatch: "bg-card", usage: "Cards e seções" },
      { name: "surface-raised", swatch: "bg-surface-raised", usage: "Elementos elevados" },
      { name: "popover", swatch: "bg-popover", usage: "Dropdowns, modais" },
    ],
  },
  {
    title: "Texto e bordas",
    description: "Hierarquia tipográfica por cor e separadores.",
    tokens: [
      { name: "foreground", swatch: "bg-foreground", usage: "Texto principal" },
      { name: "muted-foreground", swatch: "bg-muted-foreground", usage: "Texto de apoio" },
      { name: "text-subtle", swatch: "bg-text-subtle", usage: "Metadados, placeholders" },
      { name: "border", swatch: "bg-border", usage: "Bordas padrão" },
      { name: "border-strong", swatch: "bg-border-strong", usage: "Bordas de ênfase" },
    ],
  },
  {
    title: "Feedback",
    description: "Estados de sistema. Sempre acompanhados de texto — nunca cor isolada.",
    tokens: [
      { name: "success", swatch: "bg-success", usage: "Concluído, aprovado" },
      { name: "warning", swatch: "bg-warning", usage: "Pendência, atenção" },
      { name: "destructive", swatch: "bg-destructive", usage: "Erro, glosa, exclusão" },
      { name: "info", swatch: "bg-info", usage: "Informação neutra" },
      { name: "purple", swatch: "bg-purple", usage: "Categoria especial (receita controlada)" },
    ],
  },
];

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

export interface TypeSpec {
  label: string;
  className: string;
  spec: string;
  sample: string;
}

export const typeScale: TypeSpec[] = [
  {
    label: "Título de página (H1)",
    className: "font-display text-2xl font-semibold tracking-tight text-foreground",
    spec: "Plus Jakarta Sans · 24px · 600 · -0.01em",
    sample: "Solicitar OPME",
  },
  {
    label: "Título de seção (H2)",
    className: "font-display text-base font-semibold tracking-tight text-foreground",
    spec: "Plus Jakarta Sans · 16px · 600",
    sample: "Paciente e convênio",
  },
  {
    label: "Rótulo de campo",
    className: "text-sm font-medium text-foreground",
    spec: "Vazirmatn · 14px · 500",
    sample: "Nome do beneficiário",
  },
  {
    label: "Corpo",
    className: "text-sm text-foreground",
    spec: "Vazirmatn · 14px · 400",
    sample: "Preencha os dados para gerar a solicitação de autorização.",
  },
  {
    label: "Apoio / descrição",
    className: "text-sm text-muted-foreground",
    spec: "Vazirmatn · 14px · 400 · muted-foreground",
    sample: "Gere receitas médicas digitais, comuns ou especiais.",
  },
  {
    label: "Metadado",
    className: "text-xs text-muted-foreground",
    spec: "Vazirmatn · 12px · 400",
    sample: "Atualizado há 3 minutos",
  },
  {
    label: "Numérico / código",
    className: "font-mono text-sm text-foreground",
    spec: "JetBrains Mono · 14px",
    sample: "ANS 357511 · 0.35.02.00-3",
  },
];

export const radiusScale = [
  { name: "rounded-md", className: "rounded-md", usage: "Botões, inputs" },
  { name: "rounded-lg", className: "rounded-lg", usage: "Ícones, chips" },
  { name: "rounded-xl", className: "rounded-xl", usage: "Blocos internos" },
  { name: "rounded-2xl", className: "rounded-2xl", usage: "Cards e seções" },
  { name: "rounded-full", className: "rounded-full", usage: "Badges e pills" },
];

export const spacingScale = [
  { name: "gap-2", size: "8px", usage: "Ícone + texto, grupos de botões" },
  { name: "gap-3", size: "12px", usage: "Campos relacionados" },
  { name: "gap-4", size: "16px", usage: "Grid de formulário" },
  { name: "space-y-6", size: "24px", usage: "Entre seções de uma página" },
  { name: "p-6", size: "24px", usage: "Padding interno de card" },
];

export const elevationScale = [
  { name: "shadow-xs", className: "shadow-xs", usage: "Cards e seções (padrão)" },
  { name: "shadow-sm", className: "shadow-sm", usage: "Botões secundários" },
  { name: "shadow-md", className: "shadow-md", usage: "Dropdowns e popovers" },
  { name: "shadow-lg", className: "shadow-lg", usage: "Modais" },
];
