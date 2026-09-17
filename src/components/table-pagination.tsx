import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

interface TablePaginationProps {
  /** Identificador base para associar rótulo e seletor. */
  id: string;
  /** Total de resultados já filtrados. */
  totalItems: number;
  /** Página atual (1-based). */
  page: number;
  /** Itens exibidos por página. */
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
  className?: string;
}

/** Sequência de páginas com elipses, mantendo primeira, última e vizinhas da atual. */
function buildPageItems(page: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) items.push("ellipsis");
  for (let current = start; current <= end; current += 1) items.push(current);
  if (end < totalPages - 1) items.push("ellipsis");

  items.push(totalPages);
  return items;
}

/**
 * Rodapé de paginação padrão das listagens: contagem de resultados à esquerda,
 * itens por página e navegação à direita. Deve receber sempre o total já filtrado.
 */
export function TablePagination({
  id,
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  className,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);
  const pageItems = buildPageItems(currentPage, totalPages);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {`Mostrando ${firstItem} a ${lastItem} de ${totalItems} ${
          totalItems === 1 ? "resultado" : "resultados"
        }`}
      </p>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 sm:justify-end">
        <div className="flex items-center gap-2">
          <Label htmlFor={`${id}-page-size`} className="text-sm text-muted-foreground">
            Itens por página
          </Label>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger id={`${id}-page-size`} className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Pagination className="mx-0 w-auto min-w-0 justify-end">
          <PaginationContent className="flex-nowrap justify-end">
            <PaginationItem>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Página anterior"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
            </PaginationItem>

            {/* Em telas estreitas, a lista de páginas dá lugar ao indicador compacto. */}
            <PaginationItem className="sm:hidden">
              <span className="px-2 text-sm text-muted-foreground" aria-hidden="true">
                {`Página ${currentPage} de ${totalPages}`}
              </span>
            </PaginationItem>

            {pageItems.map((item, index) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`} className="hidden sm:flex">
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item} className="hidden sm:flex">
                  <Button
                    type="button"
                    variant={item === currentPage ? "outline" : "ghost"}
                    size="icon"
                    aria-label={`Página ${item}`}
                    aria-current={item === currentPage ? "page" : undefined}
                    onClick={() => onPageChange(item)}
                  >
                    {item}
                  </Button>
                </PaginationItem>
              ),
            )}


            <PaginationItem>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Próxima página"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
