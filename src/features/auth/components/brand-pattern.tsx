import haisPattern from "@/assets/hais-pattern.svg";

/**
 * Original Hais pattern kept as a single grouped composition. The radial mask
 * anchors visibility at the bottom-left corner and dissolves it toward the
 * top/right so it never ends on a straight edge or sits behind the headline.
 */
const fadeMask =
  "radial-gradient(ellipse 85% 90% at 0% 100%, #000 0%, rgb(0 0 0 / 0.75) 35%, rgb(0 0 0 / 0.3) 60%, transparent 82%)";

export function BrandPattern({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <img
        src={haisPattern}
        alt=""
        draggable={false}
        className="absolute bottom-[-14vh] left-[-6vw] h-[105vh] w-auto max-w-none opacity-60"
        style={{ maskImage: fadeMask, WebkitMaskImage: fadeMask }}
      />
    </div>
  );
}
