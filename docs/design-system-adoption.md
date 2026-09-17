# Adotar o Design System HaisTech em outro produto

Guia mínimo para reaproveitar a mesma base visual em um novo produto, sem
recriar tokens nem componentes.

## 1. Dependências mínimas

- React 19 + TypeScript estrito
- Tailwind CSS v4 (configuração em CSS, sem `tailwind.config.js`)
- Radix UI (apenas os pacotes dos componentes usados), `class-variance-authority`,
  `clsx`, `tailwind-merge`
- `lucide-react` (biblioteca única de ícones)
- `sonner` (toasts)

## 2. Fundamentos

1. Copiar `src/styles.css` (tokens claro/escuro, utilities `icon-optical`,
   `metric-*`, `text-eyebrow`, ajustes de campos de data).
2. Carregar as três famílias por `<link>` no head da rota raiz — nunca por
   `@import` de URL no CSS: Plus Jakarta Sans, Vazirmatn e JetBrains Mono.
3. Copiar `src/lib/theme.ts` para a preferência de tema (claro/escuro/sistema) e
   `src/lib/utils.ts` (`cn`).
4. Remover, se não fizer sentido no novo produto, apenas os tokens específicos
   do HaisFaturamento: `quality-*` e `guide-type-*`.

## 3. Componentes

Copiar, nesta ordem:

1. `src/components/ui/**` — primitivos.
2. `src/components/*.tsx` — composições compartilhadas (`PageHeader`,
   `SurfaceCard`, `SectionCard`, `FilterCard`, `DataTable`, `form-field`,
   `form-action-bar`, `app-modal`, `confirm-dialog`, `data-state`, `info-hint`,
   `status-pill`, `saved-indicator`, `app-tabs`, `search-page-layout`).
3. `src/design-system/` — entrada pública e catálogo de fundamentos.

Não copiar: `src/features/**`, `AppSidebar`, `SiteFooter`, `ScaledGuideSheet`,
`kits-modal`, `procedure-code-modal`, `signature-field` e os fac-símiles
impressos — todos dependem da marca, das rotas ou do domínio do HaisFaturamento.

`AppSidebar` e `SiteFooter` servem como referência de anatomia: recriar com a
marca do novo produto, mantendo os tokens `sidebar-*`.

## 4. Guarda-corpos

Copiar também:

- `scripts/visual/design-system-rules.mjs` (fonte única das regras),
  `scripts/visual/check-design-tokens.mjs` e a configuração `eslint.ds.config.js`
- `src/tests/design-system-tokens.test.ts` e `design-system-controls.test.ts`

Ajustar apenas as allowlists para os caminhos do novo produto.

## 5. Regras de uso

- Só tokens semânticos: nunca `#hex`, `bg-white/black` ou paleta padrão do Tailwind.
- Só a escala de tamanhos: nunca `text-[13px]`, `w-[45px]` e afins.
- Controles nativos apenas dentro de `components/ui`.
- Ícones sempre de `lucide-react`, com `aria-hidden` e `icon-optical` ao lado de texto.
- Toda superfície de dados cobre carregando, vazio, erro e sucesso.
- WCAG 2.2 AA e mobile-first, conforme `docs/design-system-checklist.md`.
