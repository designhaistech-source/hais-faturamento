export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="flex w-full flex-col items-center gap-1 px-4 py-6 text-center text-xs leading-relaxed text-muted-foreground sm:px-6 lg:flex-row lg:justify-between lg:gap-6 lg:px-10 lg:text-left">
        <span className="lg:whitespace-nowrap">
          © {year} HaisFaturamento — Todos os direitos reservados.
        </span>
        <span className="lg:whitespace-nowrap">Uma iniciativa de HaisTech.</span>
      </div>
    </footer>
  );
}
