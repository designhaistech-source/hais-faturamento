/**
 * Entrada pública do design system HaisTech.
 *
 * Reexporta — sem reimplementar — os fundamentos, primitivos e composições que
 * já estão em uso no produto. Nenhum estilo, variante ou comportamento é
 * alterado aqui: este arquivo apenas define qual é o núcleo reutilizável por
 * outros produtos e qual é específico do HaisFaturamento (ver `docs/design-system-catalog.md`).
 *
 * Os caminhos originais (`@/components/...`) continuam válidos para o código
 * existente; novas telas e novos produtos devem importar deste módulo.
 */

/* ---------------- Fundamentos ---------------- */

export { cn } from "@/lib/utils";
export { useTheme, setThemePreference, type ThemePreference } from "@/lib/theme";
export * from "./tokens";

/* ---------------- Primitivos de formulário ---------------- */

export { Button, buttonVariants, type ButtonProps } from "@/components/ui/button";
export { Input } from "@/components/ui/input";
export { Textarea } from "@/components/ui/textarea";
export { Label } from "@/components/ui/label";
export { Checkbox } from "@/components/ui/checkbox";
export { Switch } from "@/components/ui/switch";
export { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
export { Slider } from "@/components/ui/slider";
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export { Combobox, MultiSelect, type ComboboxOption } from "@/components/ui/combobox";
export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
export { Calendar } from "@/components/ui/calendar";

/* ---------------- Composições de formulário ---------------- */

export {
  Field,
  SearchField,
  SearchInput,
  SelectField,
  type SelectOption,
} from "@/components/form-field";
export { FormActionBar, type FormActionStep } from "@/components/form-action-bar";
export { SavedIndicator, formatSavedTime } from "@/components/saved-indicator";

/* ---------------- Estrutura e superfícies ---------------- */

export { PageHeader } from "@/components/page-header";
export { SurfaceCard } from "@/components/surface-card";
export { SectionCard, type SectionCardProps } from "@/components/section-card";
export { FilterCard, type FilterCardProps } from "@/components/filter-card";
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
export { Separator } from "@/components/ui/separator";
export { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
export { AspectRatio } from "@/components/ui/aspect-ratio";
export { SearchPageLayout } from "@/components/search-page-layout";
export {
  AppShell,
  PageContainer,
  type AppShellProps,
  type PageContainerProps,
} from "@/components/app-shell";

/* ---------------- Tabelas ---------------- */

export {
  DataTable,
  DataTableBody,
  DataTableCard,
  DataTableCardActions,
  DataTableCardFields,
  DataTableCardHeader,
  DataTableCardList,
  DataTableCell,
  DataTableDesktop,
  DataTableEmptyRow,
  DataTableHead,
  DataTableHeader,
  DataTableRoot,
  DataTableRow,
  type DataTableCardField,
} from "@/components/data-table";
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

/* ---------------- Tags, badges e chips ---------------- */

export { Badge, badgeVariants, type BadgeProps } from "@/components/ui/badge";
export { Chip, chipVariants, type ChipProps } from "@/components/ui/chip";
export { StatusPill, type StatusPillProps } from "@/components/status-pill";

/* ---------------- Sobreposições ---------------- */

export { AppModal, type AppModalProps } from "@/components/app-modal";
export {
  ConfirmDialog,
  type ConfirmDialogProps,
  type ConfirmTone,
} from "@/components/confirm-dialog";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  type DialogContentProps,
} from "@/components/ui/dialog";
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
export { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  tooltipPanelClass,
} from "@/components/ui/tooltip";
export { InfoHint } from "@/components/info-hint";
export { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

/* ---------------- Navegação ---------------- */

export { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
export {
  appTabsIconClass,
  appTabsLabelClass,
  appTabsListClass,
  appTabsTriggerClass,
} from "@/components/app-tabs";
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/* ---------------- Feedback e estados ---------------- */

export { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
export { Toaster } from "@/components/ui/sonner";
export { Progress } from "@/components/ui/progress";
export { Skeleton } from "@/components/ui/skeleton";
export { EmptyState, ErrorState, LoadingState, TableSkeleton } from "@/components/data-state";
export { EmptyStateCard } from "@/components/empty-state-card";
export {
  TablePagination,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from "@/components/table-pagination";

/* ---------------- Gráficos (Recharts) ---------------- */

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
