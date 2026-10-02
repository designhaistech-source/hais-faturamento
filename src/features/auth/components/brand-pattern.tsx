import haisPattern from "@/assets/hais-pattern-fade.svg.asset.json";

/**
 * Hais pattern; the file already carries its own top fade. The wrapper mask
 * cuts a clean horizontal gap behind the footer copyright so it never sits on shapes.
 */
const footerClearMask =
  "linear-gradient(to top, #000 0 26px, transparent 26px 56px, #000 56px)";

export function BrandPattern({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className} style={{ maskImage: footerClearMask, WebkitMaskImage: footerClearMask }}>
      <img
        src={haisPattern.url}
        alt=""
        draggable={false}
        className="absolute bottom-[-38vh] left-[-13vh] h-[80vh] w-auto max-w-none brightness-120 saturate-115"
      />
    </div>
  );
}
