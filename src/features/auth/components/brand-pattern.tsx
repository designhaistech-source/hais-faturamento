import haisPattern from "@/assets/hais-pattern-fade.svg.asset.json";

/** Hais pattern; the file already carries its own top fade. A soft glow behind it gives a modern, luminous feel. */
export function BrandPattern({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <div className="absolute bottom-[-20vh] left-[-10vh] size-[60vh] rounded-full bg-brand-highlight opacity-20 blur-[120px] motion-safe:animate-pulse [animation-duration:8s]" />
      <img
        src={haisPattern.url}
        alt=""
        draggable={false}
        className="absolute bottom-[-38vh] left-[-13vh] h-[80vh] w-auto max-w-none brightness-120 saturate-115 drop-shadow-[0_0_24px_var(--brand-highlight)]"
      />
    </div>
  );
}
