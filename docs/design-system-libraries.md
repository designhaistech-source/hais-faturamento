# Base tecnológica do Design System HaisTech

Auditoria do projeto atual (HaisFaturamento) e definição da base de implementação
para os próximos produtos. Nenhuma tela foi alterada visualmente: o documento
registra o que já está padronizado e o que permanece intencionalmente fora das
três bibliotecas de referência.

Bibliotecas de referência:

- **Radix UI** — comportamento e acessibilidade dos componentes de interface
- **Lucide** (`lucide-react`) — biblioteca única de ícones
- **Recharts** — gráficos e visualizações de dados

## 1. Radix UI

### Já implementados sobre Radix (referência oficial)

`accordion`, `alert-dialog`, `aspect-ratio`, `avatar`, `breadcrumb`, `button`
(via `Slot`), `checkbox`, `collapsible`, `context-menu`, `dialog`,
`dropdown-menu`, `form` (via `Label`/`Slot`), `hover-card`, `label`, `menubar`,
`navigation-menu`, `popover`, `progress`, `radio-group`, `scroll-area`,
`select`, `separator`, `sheet`, `sidebar`, `slider`, `switch`, `tabs`, `toggle`,
`toggle-group`, `tooltip`.

Todas as composições compartilhadas (`AppModal`, `ConfirmDialog`, `SectionCard`,
`FilterCard`, `InfoHint`, `app-tabs`) são montadas sobre esses primitivos — logo,
já herdam foco, `aria-*` e navegação por teclado do Radix.

### Sem equivalente no Radix (mantidos por decisão)

| Componente | Implementação | Por que permanece |
| --- | --- | --- |
| `input`, `textarea` | elementos nativos estilizados | Radix não oferece primitivo de campo de texto |
| `card`, `badge`, `chip`, `alert`, `skeleton`, `table`, `pagination` | markup + CVA | são padrões de estilo, sem comportamento a delegar |
| `combobox`, `MultiSelect`, `command` | `cmdk` + `Popover` do Radix | o Radix não tem combobox/autocomplete; a sobreposição já é Radix |
| `calendar` | `react-day-picker` | calendário acessível fora do escopo do Radix |
| `drawer` | `vaul` (construído sobre Radix Dialog) | gesto de arraste em mobile |
| `sonner` (`Toaster`) | `sonner` | fila de toasts; o `@radix-ui/react-toast` foi descontinuado |
| `carousel` | `embla-carousel-react` | sem primitivo Radix equivalente |
| `resizable` | `react-resizable-panels` | idem |

Regra: novos componentes com comportamento interativo (sobreposição, foco preso,
seleção, navegação por teclado) devem usar Radix. Componentes puramente visuais
não precisam de dependência.

## 2. Ícones — Lucide

Todos os ícones do produto vêm de `lucide-react` (65 arquivos). Não há
`react-icons`, Heroicons, Tabler nem SVG inline decorativo no código de UI.

Regras já valendo (verificadas por `bun run lint:ds` e pelos testes de tokens):

- 16px como padrão, 14px em controles `sm`, 12px em badges
- `aria-hidden` em ícone decorativo; rótulo textual ou `aria-label` quando informativo
- `icon-optical` sempre que o ícone estiver ao lado de texto
- Marca, logotipos e os fac-símiles impressos TISS continuam como imagem/SVG próprio — não são ícones de interface

## 3. Gráficos — Recharts

- Wrapper oficial: `src/components/ui/chart.tsx` (`ChartContainer`,
  `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`,
  `ChartStyle`) — resolve cores por token e tema claro/escuro.
- Uso atual: o painel "Visão geral" (`src/routes/index.tsx`) importa Recharts
  diretamente (`AreaChart`, `BarChart`, `PieChart`, `Pie`, `Cell`, `Sector`,
  `LabelList`, `ResponsiveContainer`, `Tooltip`) com tooltips próprios.

Inconsistência registrada, sem correção automática: existem dois caminhos para
gráficos (wrapper x Recharts direto). Migrar o painel para o wrapper altera a
aparência dos tooltips e das legendas atuais, o que está fora do escopo
"não alterar visualmente". Decisão: **o wrapper é a referência para novos
gráficos e novos produtos**; o painel do HaisFaturamento permanece como está até uma
aprovação explícita de mudança visual.

Exceção consciente: o card "Procedimentos solicitados por prestador" é um mapa
de calor em grade — o Recharts não tem esse tipo de gráfico, então segue como
composição de células com tokens semânticos.

## 4. Compartilhável x específico do HaisFaturamento

### Compartilhável entre produtos HaisTech

Sem regra de negócio; importável por `@/design-system`.

- **Fundamentos:** `src/styles.css` (tokens claro/escuro e utilities),
  `src/design-system/tokens.ts`, `src/lib/theme.ts`, `src/lib/utils.ts`
- **Primitivos:** todo `src/components/ui/**`, incluindo o wrapper de gráficos
- **Composições:** `PageHeader`, `SurfaceCard`, `SectionCard`, `FilterCard`,
  `DataTable*`, `form-field`, `form-action-bar`, `app-modal`, `confirm-dialog`,
  `data-state`, `info-hint`, `status-pill`, `saved-indicator`, `app-tabs`,
  `search-page-layout`, `app-breadcrumb`, `camera-capture-dialog`
- **Guarda-corpos:** `scripts/visual/design-system-rules.mjs`,
  `scripts/visual/check-design-tokens.mjs`, `eslint.ds.config.js`,
  `src/tests/design-system-tokens.test.ts`, `design-system-controls.test.ts`

### Específico do HaisFaturamento (não portar)

- Todo `src/features/**` (guias TISS/SUS, prescrição, OPME, documentos,
  beneficiários, dashboard, CID, procedimentos)
- Tokens de domínio: `quality-*` e `guide-type-*`
- Componentes de marca/domínio: `app-sidebar`, `site-footer`,
  `scaled-guide-sheet`, `kits-modal`, `procedure-code-modal`,
  `signature-field`, fac-símiles `*-guide-preview.tsx` e
  `guide-print-primitives.tsx`
- Bibliotecas de saída de documento (`jspdf`, `jspdf-autotable`) e as regras de
  papel A4/A5 por tipo de documento

`app-sidebar` e `site-footer` servem apenas como referência de anatomia:
recriar com a marca do novo produto, reaproveitando os tokens `sidebar-*`.

## 5. Como um novo produto começa

1. Copiar fundamentos e guarda-corpos (seção 4) e ajustar as allowlists.
2. Copiar `src/components/ui/**` e as composições compartilhadas.
3. Importar sempre por `@/design-system` — nunca por caminhos internos.
4. Componentes novos: comportamento interativo em Radix, ícones em Lucide,
   gráficos no wrapper Recharts.
5. Não criar `src/features/**` do novo produto dentro do núcleo compartilhado.

Detalhes de componentes por categoria: `docs/design-system-catalog.md`.
Passo a passo de adoção: `docs/design-system-adoption.md`.

## Navegação e layout: base compartilhável vs. específico do produto

Auditoria feita sem alterar nenhuma tela: o esqueleto de página está repetido
manualmente em 12 telas (`div.flex.min-h-screen` + `AppSidebar` + `main` +
coluna de conteúdo + `AppBreadcrumb` + `PageHeader`), com pequenas divergências
de espaçamento entre elas.

### Compartilhável (estrutura e comportamento genéricos)

| Padrão | Referência oficial | Observação |
| --- | --- | --- |
| Esqueleto da página | `AppShell` (`src/components/app-shell.tsx`) | Sidebar como slot; nenhuma rota ou item de menu embutido. |
| Coluna de conteúdo | `PageContainer` | Respiro lateral progressivo e `pt-20` para o gatilho flutuante da navegação em telas estreitas. |
| Título de página | `PageHeader` | Título + descrição + ações; sem conteúdo fixo. |
| Trilha de navegação | `Breadcrumb` (`src/components/ui/breadcrumb.tsx`) | Primitivo Radix-compatível, sem mapa de rotas. |
| Anatomia da navegação lateral | `src/components/ui/sidebar.tsx` + tokens `sidebar-*` | Provider, colapso, gatilho mobile, foco e teclado. |
| Abas de seção | `app-tabs` | Classes compartilhadas sobre Radix Tabs. |
| Layout de busca | `SearchPageLayout` | Estrutura de tela de consulta. |

### Específico do produto (não portar)

- `src/components/app-sidebar.tsx`: itens de menu, rotas, ícones, agrupamentos,
  marca "Guias+" e menu do usuário. Serve apenas como referência de anatomia.
- `src/components/app-breadcrumb.tsx`: mapa `ROUTE_META` de rotas → rótulos.
- `src/components/site-footer.tsx`: conteúdo institucional.
- Textos, ícones (`lucide-react`) e ações de cada `PageHeader`.

### Inconsistências encontradas (nenhuma corrigida — exigem aprovação)

Todas mudariam pixels em telas existentes, por isso foram apenas registradas:

1. Espaçamento lateral/vertical da coluna de conteúdo divergente:
   `px-4 py-6 sm:px-6 sm:py-8` (perfil, guias emitidas) vs. `px-6 py-8`
   (relatórios, OPME, extrair dados).
2. `md:pt-8` na maioria das telas vs. `md:pt-6` em "Guias emitidas".
3. `overflow-x-hidden` no `main` em quase todas as telas, ausente em
   "Guias emitidas" (tabela larga) — divergência intencional na prática.
4. `min-w-0` aplicado só em parte das telas.

Decisão vigente: `AppShell` + `PageContainer` são a referência para telas e
produtos novos; as 12 telas atuais permanecem com o markup próprio até uma
migração aprovada explicitamente, que unificaria os itens 1–4 acima.
