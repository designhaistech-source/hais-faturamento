import haisPattern from "@/assets/hais-pattern.svg";

/**
 * Original Hais pattern kept as a single grouped composition. A top-only
 * vertical mask fades the image in from its upper edge so it emerges from the
 * background instead of starting abruptly; sides and bottom stay fully visible.
 */
// Image spans ~-10vh..100vh; transparent band covers the headline area (~up to 55vh).
const fadeMask = "linear-gradient(to bottom, transparent 0%, transparent 58%, #000 76%, #000 100%)";

export function BrandPattern({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <img
        src={haisPattern}
        alt=""
        draggable={false}
        className="absolute bottom-[-40vh] left-[-260px] h-[110vh] w-auto max-w-none opacity-60"
        style={{ maskImage: fadeMask, WebkitMaskImage: fadeMask }}
      />
    </div>
  );
}
