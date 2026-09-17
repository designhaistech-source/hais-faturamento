import { Profiler, type ProfilerOnRenderCallback, type ReactNode } from "react";

interface RenderSample {
  phase: "mount" | "update" | "nested-update";
  actualDuration: number;
  baseDuration: number;
  commitDuration: number;
}

interface RenderStats {
  id: string;
  mounts: number;
  updates: number;
  totalActual: number;
  maxActual: number;
  lastActual: number;
  lastBase: number;
  samples: RenderSample[];
}

const SLOW_RENDER_MS = 16;

type ProfilerWindow = Window & {
  __renderProfile?: Record<string, RenderStats>;
};

/** Aggregated stats readable from the console via `window.__renderProfile`. */
function getStore(): Record<string, RenderStats> | null {
  if (typeof window === "undefined") return null;
  const w = window as ProfilerWindow;
  if (!w.__renderProfile) w.__renderProfile = {};
  return w.__renderProfile;
}

const onRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  _startTime,
  commitDuration,
) => {
  const store = getStore();
  if (!store) return;

  const stats: RenderStats =
    store[id] ??
    (store[id] = {
      id,
      mounts: 0,
      updates: 0,
      totalActual: 0,
      maxActual: 0,
      lastActual: 0,
      lastBase: 0,
      samples: [],
    });

  if (phase === "mount") stats.mounts += 1;
  else stats.updates += 1;

  stats.totalActual += actualDuration;
  stats.maxActual = Math.max(stats.maxActual, actualDuration);
  stats.lastActual = actualDuration;
  stats.lastBase = baseDuration;
  stats.samples.push({ phase, actualDuration, baseDuration, commitDuration });
  if (stats.samples.length > 50) stats.samples.shift();

  const level = actualDuration > SLOW_RENDER_MS ? "warn" : "info";
  console[level](
    `[perf][${id}] ${phase} actual=${actualDuration.toFixed(2)}ms base=${baseDuration.toFixed(
      2,
    )}ms commit=${commitDuration.toFixed(2)}ms renders=${stats.mounts + stats.updates}`,
  );

  if (typeof performance !== "undefined" && "measure" in performance) {
    try {
      performance.measure(`${id}:${phase}`, {
        start: _startTime,
        duration: actualDuration,
      });
    } catch {
      // measure with options is unsupported in some engines; metrics stay in console/store.
    }
  }
};

/**
 * Development-only React Profiler wrapper.
 * In production it renders children untouched (zero overhead).
 */
export function RenderProfiler({ id, children }: { id: string; children: ReactNode }) {
  if (!import.meta.env.DEV) return <>{children}</>;
  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}
