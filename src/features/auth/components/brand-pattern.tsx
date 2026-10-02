import haisPattern from "@/assets/hais-pattern-fade.svg.asset.json";

/**
 * Hais pattern; the file already carries its own top fade. The wrapper mask
 * opens a soft clear zone behind the footer copyright so it never sits on shapes.
 */
const footerClearMask =
  "radial-gradient(ellipse 300px 56px at 190px calc(100% - 41px), transparent 55%, #000 100%)";

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
