# Catálogo do Design System HaisTech

Referência única do que já existe e está em uso. Nada aqui redesenha telas: o
catálogo apenas classifica os padrões atuais para que novas telas e outros
produtos HaisTech reutilizem a mesma base.

- Fundamentos (cores, tema): `src/styles.css`
- Fundamentos legíveis por código: `src/design-system/tokens.ts`
- Entrada pública para reuso: `src/design-system/index.ts`
- Guia vivo navegável: rota `/design-system`
- Checklist de aplicação: `docs/design-system-checklist.md`
- Adoção em outro produto: `docs/design-system-adoption.md`
- Base tecnológica (Radix, Lucide, Recharts) e o que é compartilhável:
  `docs/design-system-libraries.md`

## Camadas

| Camada | Onde vive | O que é |
| --- | --- | --- |
| Fundamentos | `src/styles.css`, `src/lib/theme.ts` | Tokens de cor (claro/escuro), famílias, utilities (`icon-optical`, `metric-*`, `text-eyebrow`) |
| Primitivos | `src/components/ui/**` | Base Radix + CVA: botão, campos, tabela, diálogo, menu, tooltip |
| Composições compartilhadas | `src/components/*.tsx` | Padrões opinativos do produto: `PageHeader`, `SurfaceCard`, `DataTable`, `AppModal`, `DataState` |
| Específico de produto | `src/features/**` | Domínio HaisFaturamento: guias TISS, documentos A4/A5, prescrição, OPME |

Regra de reuso: **fundamentos + primitivos + composições compartilhadas** são
portáveis. Tudo em `src/features/**`, os tokens `quality-*`/`guide-type-*` e os
fac-símiles impressos permanecem no HaisFaturamento.

## Fundamentos

| Grupo | Conteúdo |
| --- | --- |
| Cores | 6 grupos semânticos em `colorTokenGroups` + escala neutra 50–900, com tema escuro completo |
| Tipografia | Plus Jakarta Sans (títulos), Vazirmatn (corpo), JetBrains Mono (números/códigos) — estilos em `typeStyles` |
| Espaçamento | `gap-1.5/2/3/4`, `space-y-4/6`, padding de card `p-4/p-5/p-6` |
| Raio | `rounded-md` (controles), `rounded-lg`, `rounded-xl`, `rounded-2xl` (cards), `rounded-full` (badges) |
| Bordas | `border-border`, `border-input`, `border-strong`, tracejada para áreas vazias |
| Sombras | `shadow-xs` (cards), `shadow-sm` (campos), `shadow` (primário), `shadow-md` (menus), `shadow-lg` (modais) |
| Ícones | `lucide-react`, 16px padrão, 14px em `sm`, 12px em badges, sempre com `icon-optical` ao lado de texto |

## Componentes por categoria

| Categoria | Referência oficial | Observações |
| --- | --- | --- |
| Botões | `Button` (variantes `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`; tamanhos `default`, `sm`, `lg`, `icon`) | Estados de foco, desabilitado e ícone já embutidos |
| Barra de ações | `FormActionBar` | Passos de preenchimento + ações primárias de formulários longos |
| Campos | `Field`, `SearchField`, `SelectField`, `Input`, `Textarea`, `Checkbox`, `Switch`, `RadioGroup`, `Slider` | `Field` cuida de rótulo, obrigatório/opcional, hint, erro e `aria-*` |
| Seleção avançada | `Combobox`, `MultiSelect` | Busca, chips com contador, multiseleção |
| Assinatura | `SignatureField` | Específico de documentos, mas reutilizável |
| Tabelas | `DataTable*` | Cabeçalho, células, linha vazia e alternativa em cards no mobile |
| Paginação | `Pagination*` | — |
| Cards | `SurfaceCard` (padrão), `SectionCard` (etapas/colapsável), `FilterCard` (grade de filtros), `Card` (primitivo) | Todos em `rounded-2xl` + `shadow-xs` |
| Cabeçalho de página | `PageHeader` | H1 + descrição + ações |
| Tags e badges | `Badge` (semântico estático), `Chip` (seleção interativa), `StatusPill` (progresso) | Escolher pelo comportamento, não pela aparência |
| Filtros | `FilterCard` + `Combobox`/`MultiSelect` + `SearchField` | Inclui ação "Limpar filtros" |
| Dropdowns e menus | `DropdownMenu*`, `Popover`, `Command` | — |
| Modais | `AppModal` (padrão), `ConfirmDialog` (confirmação), `Dialog`/`Sheet`/`Drawer` (primitivos) | Preferir `AppModal` a montar `Dialog` manualmente |
| Tooltips | `Tooltip*`, `tooltipPanelClass`, `InfoHint` | `InfoHint` para explicações ao lado de rótulos |
| Navegação | `AppSidebar`, `AppBreadcrumb`, `Tabs` + `appTabs*Class`, `Accordion`, `Collapsible` | `AppSidebar` depende da marca e das rotas do produto |
| Feedback | `Toaster` (sonner), `Alert`, `Progress` | Toda ação confirma resultado e bloqueia envio duplicado |
| Estados de dados | `LoadingState`, `EmptyState`, `ErrorState`, `TableSkeleton`, `Skeleton` | Obrigatórios em qualquer superfície de dados |
| Salvamento | `SavedIndicator` | Rascunho salvo/hora |
| Layout de busca | `SearchPageLayout` | Páginas de consulta (CID, procedimentos) |

## Estados cobertos

| Estado | Como é expresso |
| --- | --- |
| Sucesso | `success` / `success-muted` / `success-strong`, `Badge variant="success-soft"`, toast |
| Alerta | `warning*`, `Badge variant="warning-soft"`, `Alert` |
| Erro | `destructive*`, mensagem do `Field` com `role="alert"`, `ErrorState` |
| Informação | `info*`, `Badge variant="info-soft"`, `InfoHint` |
| Carregando | `LoadingState`, `TableSkeleton`, `Skeleton`, `Progress`, spinner do `SearchInput` |
| Vazio | `EmptyState`, `DataTableEmptyRow`, "—" em `muted-foreground` |
| Desabilitado | `disabled:opacity-50` + `cursor-not-allowed` (padrão dos primitivos) |
| Somente leitura | `read-only:bg-muted/50` mantendo contraste total |
| Foco | `ring-ring` visível em todos os controles |

## Como usar

```tsx
import { PageHeader, SurfaceCard, Field, Input, Button } from "@/design-system";
```

Os caminhos antigos (`@/components/...`) continuam funcionando; o módulo
`@/design-system` é a fronteira recomendada para novas telas e produtos.
