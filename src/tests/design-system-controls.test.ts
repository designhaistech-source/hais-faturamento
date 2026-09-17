import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guard-rail de design system: nenhum arquivo da aplicação deve renderizar
 * controles HTML nativos (button, input, select, textarea). Primitivos do
 * design system (src/components/ui) e casos conscientes marcados com
 * `ds-allow: motivo` são as únicas exceções permitidas.
 */

const ROOT = join(process.cwd(), "src");

/** Diretórios que contêm primitivos do design system ou não geram UI da app. */
const IGNORED_DIRS = ["components/ui", "tests"];

/** Arquivos com HTML estático fora do React (ex.: página de erro do servidor). */
const IGNORED_FILES = ["lib/error-page.ts"];

const SOURCE_EXTENSIONS = [".ts", ".tsx"];

/** Marcador que documenta um controle nativo intencional. */
const ALLOW_MARKER = "ds-allow";

/** Quantas linhas ao redor da abertura da tag aceitam o marcador. */
const MARKER_LOOKAROUND = 3;

/** Tag nativa → componente do design system que deve substituí-la. */
const NATIVE_CONTROLS: Record<string, string> = {
  button: "<Button> de @/components/ui/button",
  input: "<Input> / <Checkbox> / <RadioGroup> de @/components/ui/*",
  select: "<Select> de @/components/ui/select",
  textarea: "<Textarea> de @/components/ui/textarea",
};

/**
 * Padrões de checkbox/radio/switch nativos. Cobrem também atributos escritos em
 * linhas separadas da abertura da tag (JSX multilinha), que o teste por tag não vê.
 */
const NATIVE_SELECTION_CONTROLS: Array<{
  label: string;
  pattern: RegExp;
  replacement: string;
}> = [
  {
    label: 'input type="checkbox"',
    pattern: /type=\{?["']checkbox["']\}?/,
    replacement: "<Checkbox> de @/components/ui/checkbox",
  },
  {
    label: 'input type="radio"',
    pattern: /type=\{?["']radio["']\}?/,
    replacement: "<RadioGroup> / <RadioGroupItem> de @/components/ui/radio-group",
  },
  {
    label: 'role="switch"',
    pattern: /role=\{?["']switch["']\}?/,
    replacement: "<Switch> de @/components/ui/switch",
  },
];

/**
 * Dropdowns, menus e popovers nativos. Menus devem vir de DropdownMenu,
 * Select, Command (combobox), Popover ou Collapsible do design system.
 */
const NATIVE_MENU_CONTROLS: Array<{
  label: string;
  pattern: RegExp;
  replacement: string;
}> = [
  {
    label: "<menu>",
    pattern: /<menu[\s>/]/,
    replacement: "<DropdownMenu> de @/components/ui/dropdown-menu",
  },
  {
    label: "<datalist>",
    pattern: /<datalist[\s>/]/,
    replacement: "<Command> / <Combobox> de @/components/ui/command",
  },
  {
    label: "<option> / <optgroup>",
    pattern: /<(option|optgroup)[\s>/]/,
    replacement: "<SelectItem> / <SelectGroup> de @/components/ui/select",
  },
  {
    label: "<details> / <summary>",
    pattern: /<(details|summary)[\s>/]/,
    replacement: "<Collapsible> de @/components/ui/collapsible",
  },
  {
    label: 'role="menu" / role="menuitem"',
    pattern: /role=\{?["']menu(item|bar)?(checkbox|radio)?["']\}?/,
    replacement: "<DropdownMenu> / <DropdownMenuItem> de @/components/ui/dropdown-menu",
  },
  {
    label: 'role="listbox" / role="option"',
    pattern: /role=\{?["'](listbox|option)["']\}?/,
    replacement: "<Select> ou <Command> de @/components/ui/*",
  },
];

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const relPath = relative(ROOT, fullPath).replaceAll("\\", "/");

    if (statSync(fullPath).isDirectory()) {
      if (IGNORED_DIRS.some((ignored) => relPath === ignored)) continue;
      collectSourceFiles(fullPath, acc);
      continue;
    }

    if (IGNORED_FILES.includes(relPath)) continue;
    if (relPath.includes(".test.")) continue;
    if (!SOURCE_EXTENSIONS.some((ext) => relPath.endsWith(ext))) continue;

    acc.push(fullPath);
  }
  return acc;
}

function findUnmarkedMatches(filePath: string, pattern: RegExp): string[] {
  const lines = readFileSync(filePath, "utf8").split("\n");
  const relPath = relative(ROOT, filePath).replaceAll("\\", "/");
  const offenders: string[] = [];

  lines.forEach((line, index) => {
    if (!pattern.test(line)) return;

    const start = Math.max(0, index - MARKER_LOOKAROUND);
    const end = Math.min(lines.length, index + MARKER_LOOKAROUND + 1);
    const context = lines.slice(start, end).join("\n");
    if (context.includes(ALLOW_MARKER)) return;

    offenders.push(`src/${relPath}:${index + 1} → ${line.trim()}`);
  });

  return offenders;
}

function findUnmarkedNativeControls(filePath: string, tag: string): string[] {
  return findUnmarkedMatches(filePath, new RegExp(`<${tag}[\\s>/]`));
}

describe("design system: controles de UI", () => {
  const files = collectSourceFiles(ROOT);

  it("encontra arquivos de UI para auditar", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const [tag, replacement] of Object.entries(NATIVE_CONTROLS)) {
    it(`não usa <${tag}> nativo sem marcação ${ALLOW_MARKER}`, () => {
      const offenders = files.flatMap((file) => findUnmarkedNativeControls(file, tag));

      expect(
        offenders,
        [
          `Use o componente ${replacement}.`,
          `Se o <${tag}> nativo for intencional, documente com um comentário "${ALLOW_MARKER}: motivo" na própria tag.`,
          "Ocorrências:",
          ...offenders,
        ].join("\n"),
      ).toEqual([]);
    });
  }

  for (const { label, pattern, replacement } of [
    ...NATIVE_SELECTION_CONTROLS,
    ...NATIVE_MENU_CONTROLS,
  ]) {
    it(`não usa ${label} nativo sem marcação ${ALLOW_MARKER}`, () => {
      const offenders = files.flatMap((file) => findUnmarkedMatches(file, pattern));

      expect(
        offenders,
        [
          `Use o componente ${replacement}.`,
          `Se o controle nativo for intencional, documente com um comentário "${ALLOW_MARKER}: motivo" na própria tag.`,
          "Ocorrências:",
          ...offenders,
        ].join("\n"),
      ).toEqual([]);
    });
  }
});
