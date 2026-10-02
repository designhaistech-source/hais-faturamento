/**
 * Página de erro servida quando a renderização falha no servidor. Como o CSS
 * do app pode não ter carregado nesse momento, os tokens do Design System
 * (src/styles.css) são espelhados aqui como variáveis — mantenha-os em sincronia.
 */
export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Não foi possível carregar a página — HaisFaturamento</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        --background: oklch(0.985 0.002 247);
        --foreground: oklch(0.22 0.04 260);
        --muted-foreground: oklch(0.44 0.035 258);
        --card: oklch(1 0 0);
        --border: oklch(0.93 0.01 255);
        --primary: oklch(0.55 0.19 255);
        --primary-foreground: oklch(0.99 0.003 247);
        --radius: 0.625rem;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --background: oklch(0.15 0.02 260);
          --foreground: oklch(0.95 0.01 250);
          --muted-foreground: oklch(0.75 0.02 255);
          --card: oklch(0.2 0.025 260);
          --border: oklch(0.28 0.03 260);
        }
      }
      body { font: 15px/1.5 "Vazirmatn", system-ui, sans-serif; background: var(--background); color: var(--foreground); display: grid; place-items: center; min-height: 100dvh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; background: var(--card); border: 1px solid var(--border); border-radius: calc(var(--radius) + 6px); }
      h1 { font-family: "Plus Jakarta Sans", system-ui, sans-serif; font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem; }
      p { color: var(--muted-foreground); margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { height: 2.25rem; padding: 0 1rem; display: inline-flex; align-items: center; border-radius: calc(var(--radius) - 2px); font: inherit; font-size: 0.875rem; font-weight: 500; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      a:focus-visible, button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
      .primary { background: var(--primary); color: var(--primary-foreground); }
      .secondary { background: var(--card); color: var(--foreground); border-color: var(--border); }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>Não foi possível carregar a página</h1>
      <p>Ocorreu um erro inesperado. Tente novamente ou volte para o início.</p>
      <div class="actions">
        <button class="primary" type="button" onclick="location.reload()">Tentar novamente</button>
        <a class="secondary" href="/">Voltar ao início</a>
      </div>
    </main>
  </body>
</html>`;
}
