type Tone = "navy" | "ocean" | "sky" | "sage" | "leaf" | "mist";
type Quadrant = "tl" | "tr" | "bl" | "br";

interface QuarterShape {
  kind: "quarter";
  x: number;
  y: number;
  r: number;
  q: Quadrant;
  tone: Tone;
}

interface CircleShape {
  kind: "circle";
  x: number;
  y: number;
  r: number;
  tone: Tone;
}

type Shape = QuarterShape | CircleShape;

const toneClass: Record<Tone, string> = {
  navy: "fill-hais-navy",
  ocean: "fill-hais-ocean",
  sky: "fill-hais-sky",
  sage: "fill-hais-sage",
  leaf: "fill-hais-leaf",
  mist: "fill-hais-mist",
};

/*
 * Coordenadas num quadro 1000×1000 ancorado no canto inferior esquerdo.
 * Formas grandes nascem nas bordas (algumas cortadas) e ficam menores e mais espaçadas rumo ao centro.
 */
const shapes: Shape[] = [
  // Borda: blocos grandes, parcialmente fora da tela
  { kind: "quarter", x: 0, y: 1000, r: 260, q: "tr", tone: "navy" },
  { kind: "quarter", x: 260, y: 1000, r: 260, q: "tl", tone: "sage" },
  { kind: "quarter", x: 0, y: 740, r: 200, q: "tr", tone: "sky" },
  { kind: "quarter", x: 0, y: 740, r: 200, q: "tl", tone: "mist" },
  { kind: "quarter", x: 200, y: 740, r: 200, q: "br", tone: "navy" },
  { kind: "quarter", x: 520, y: 1000, r: 180, q: "tr", tone: "navy" },
  { kind: "quarter", x: 520, y: 1000, r: 180, q: "tl", tone: "ocean" },
  { kind: "circle", x: -40, y: 470, r: 110, tone: "sage" },
  // Meio: formas médias, mais espaçadas
  { kind: "quarter", x: 330, y: 700, r: 130, q: "tr", tone: "mist" },
  { kind: "quarter", x: 330, y: 700, r: 130, q: "bl", tone: "leaf" },
  { kind: "circle", x: 760, y: 900, r: 70, tone: "sky" },
  { kind: "quarter", x: 150, y: 400, r: 110, q: "tr", tone: "navy" },
  { kind: "quarter", x: 560, y: 660, r: 100, q: "tl", tone: "sage" },
  // Dissipação: pequenas e esparsas, próximas ao conteúdo
  { kind: "circle", x: 330, y: 300, r: 50, tone: "mist" },
  { kind: "quarter", x: 720, y: 560, r: 70, q: "tr", tone: "navy" },
  { kind: "circle", x: 900, y: 720, r: 36, tone: "sage" },
  { kind: "quarter", x: 560, y: 380, r: 56, q: "bl", tone: "sky" },
  { kind: "circle", x: 120, y: 170, r: 34, tone: "navy" },
];

function quarterPath({ x, y, r, q }: QuarterShape) {
  const dx = q === "tr" || q === "br" ? 1 : -1;
  const dy = q === "tl" || q === "tr" ? -1 : 1;
  const sweep = dx * dy < 0 ? 1 : 0;
  return `M${x} ${y}L${x} ${y + dy * r}A${r} ${r} 0 0 ${sweep} ${x + dx * r} ${y}Z`;
}

/** Opacidade cai com a distância do canto inferior esquerdo, fazendo o pattern se dissipar rumo ao centro. */
function opacityFor({ x, y }: Shape) {
  const distance = Math.hypot(x, 1000 - y);
  return Math.max(0.06, 0.55 - distance / 1900);
}

/** Pattern geométrico institucional da Hais, puramente decorativo. */
export function BrandPattern({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMinYMax meet"
      className={className}
    >
      {shapes.map((shape, index) =>
        shape.kind === "circle" ? (
          <circle key={index} cx={shape.x} cy={shape.y} r={shape.r} className={toneClass[shape.tone]} opacity={opacityFor(shape)} />
        ) : (
          <path key={index} d={quarterPath(shape)} className={toneClass[shape.tone]} opacity={opacityFor(shape)} />
        ),
      )}
    </svg>
  );
}
