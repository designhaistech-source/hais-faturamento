#!/usr/bin/env python3
"""Visual regression para as telas do HaisFaturamento.

Uso:
  python3 scripts/visual/visual-regression.py            # compara com os baselines
  python3 scripts/visual/visual-regression.py --update   # regrava os baselines
  python3 scripts/visual/visual-regression.py --only opme --viewport desktop

Baselines: scripts/visual/baselines/<rota>__<viewport>.png
Diffs:     scripts/visual/output/  (não versionado)

Exit code 1 quando alguma tela diverge acima do limiar.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent
CONFIG = json.loads((ROOT / "targets.json").read_text())
BASELINES = ROOT / "baselines"
OUTPUT = ROOT / "output"

# Percentual máximo de pixels alterados tolerado por tela.
THRESHOLD = 0.2
# Diferença por canal abaixo da qual o pixel é considerado igual (antialias).
CHANNEL_TOLERANCE = 12


async def capture(page, target, viewport, dest: Path) -> None:
    await page.set_viewport_size({"width": viewport["width"], "height": viewport["height"]})
    await page.goto(CONFIG["baseUrl"] + target["path"], wait_until="networkidle")
    # Neutraliza animações e cursores para que o screenshot seja determinístico.
    await page.add_style_tag(
        content="*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}"
    )
    await page.wait_for_timeout(500)
    dest.parent.mkdir(parents=True, exist_ok=True)
    # `selector` recorta o screenshot num elemento: usado por fixtures de
    # componente, onde só a matriz importa (e não a altura da viewport).
    if target.get("selector"):
        await page.locator(target["selector"]).screenshot(path=str(dest))
    else:
        await page.screenshot(path=str(dest))


def compare(baseline: Path, current: Path, diff_path: Path) -> tuple[float, str]:
    a = Image.open(baseline).convert("RGB")
    b = Image.open(current).convert("RGB")
    if a.size != b.size:
        return 100.0, f"tamanho mudou {a.size} -> {b.size}"

    diff = ImageChops.difference(a, b).convert("L").point(
        lambda v: 255 if v > CHANNEL_TOLERANCE else 0
    )
    changed = sum(diff.histogram()[1:])
    total = a.size[0] * a.size[1]
    pct = (changed / total) * 100
    if pct > THRESHOLD:
        diff_path.parent.mkdir(parents=True, exist_ok=True)
        overlay = b.copy()
        overlay.paste(Image.new("RGB", a.size, (255, 0, 0)), mask=diff)
        Image.blend(b, overlay, 0.6).save(diff_path)
    return pct, ""


async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--update", action="store_true", help="regrava os baselines")
    parser.add_argument("--only", help="filtra por nome da rota")
    parser.add_argument("--viewport", help="filtra por viewport (desktop/mobile)")
    args = parser.parse_args()

    targets = [t for t in CONFIG["targets"] if not args.only or t["name"] == args.only]
    viewports = [v for v in CONFIG["viewports"] if not args.viewport or v["name"] == args.viewport]
    if not targets or not viewports:
        print("Nenhuma tela/viewport corresponde ao filtro informado.")
        return 1

    failures: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        for target in targets:
            for viewport in viewports:
                key = f"{target['name']}__{viewport['name']}"
                baseline = BASELINES / f"{key}.png"
                current = OUTPUT / f"{key}.png"

                if args.update or not baseline.exists():
                    await capture(page, target, viewport, baseline)
                    print(f"[baseline] {key}")
                    continue

                await capture(page, target, viewport, current)
                pct, note = compare(baseline, current, OUTPUT / f"{key}.diff.png")
                if pct > THRESHOLD:
                    failures.append(f"{key}: {pct:.2f}% diferente {note}".strip())
                    print(f"[FALHOU]  {key} — {pct:.2f}% de pixels alterados {note}".strip())
                else:
                    print(f"[ok]      {key} — {pct:.2f}%")

        await browser.close()

    if failures:
        print("\nDivergências visuais detectadas:")
        for f in failures:
            print(f"  - {f}")
        print(f"\nVeja os diffs em {OUTPUT}/ (pixels alterados em vermelho).")
        print("Se a mudança é intencional, rode com --update para atualizar os baselines.")
        return 1

    print("\nTodas as telas conferem com os baselines.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
